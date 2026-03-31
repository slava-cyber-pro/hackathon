import logging
import os
from datetime import date
from decimal import Decimal, InvalidOperation

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

import db

logging.basicConfig(format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

HELP_TEXT = (
    "*BudgetSphere Bot*\n\n"
    "*Quick add expense:*\n"
    "`50 groceries lunch at cafe`\n\n"
    "*Quick add income:*\n"
    "`+5000 salary monthly deposit`\n\n"
    "*Format:* `<amount> <category> [description]`\n\n"
    "*Commands:*\n"
    "/link `<token>` — Link your BudgetSphere account\n"
    "/budget — Show active budgets\n"
    "/recent — Show last 5 transactions\n"
    "/help — Show this message"
)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Welcome to *BudgetSphere*! \n\n"
        "Link your account with /link `<token>` from the web app, "
        "then send messages like `50 groceries lunch` to log expenses instantly.\n\n"
        "Type /help for all commands.",
        parse_mode="Markdown",
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")


async def cmd_link(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Usage: /link `<token>`", parse_mode="Markdown")
        return
    token = context.args[0]
    try:
        display_name = await db.link_account(token, update.effective_chat.id)
    except Exception:
        logger.exception("link failed")
        await update.message.reply_text("Something went wrong. Please try again.")
        return
    if display_name:
        await update.message.reply_text(f"Account linked! Welcome, {display_name}.")
    else:
        await update.message.reply_text("Invalid or expired token. Please generate a new one in the web app.")


async def cmd_budget(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = await db.get_user_by_chat_id(update.effective_chat.id)
    if not user:
        await update.message.reply_text("Account not linked. Use /link <token> to connect your BudgetSphere account.")
        return
    try:
        budgets = await db.get_budgets_with_spent(user.id)
    except Exception:
        logger.exception("budget query failed")
        await update.message.reply_text("Something went wrong. Please try again.")
        return
    if not budgets:
        await update.message.reply_text("No active budgets found. Create one in the web app!")
        return

    lines: list[str] = []
    for b in budgets:
        limit_val = float(b["limit"])
        spent_val = float(b["spent"])
        pct = min(int(spent_val / limit_val * 100), 100) if limit_val > 0 else 0
        filled = pct // 10
        bar = "\u2588" * filled + "\u2591" * (10 - filled)
        lines.append(
            f"*{b['category']}* ({b['period']})\n"
            f"`{bar}` {pct}%\n"
            f"${spent_val:,.2f} / ${limit_val:,.2f}"
        )
    await update.message.reply_text("\n\n".join(lines), parse_mode="Markdown")


async def cmd_recent(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = await db.get_user_by_chat_id(update.effective_chat.id)
    if not user:
        await update.message.reply_text("Account not linked. Use /link <token> to connect your BudgetSphere account.")
        return
    try:
        txns = await db.get_recent_transactions(user.id)
    except Exception:
        logger.exception("recent query failed")
        await update.message.reply_text("Something went wrong. Please try again.")
        return
    if not txns:
        await update.message.reply_text("No transactions yet. Send a message like `50 groceries lunch` to add one!", parse_mode="Markdown")
        return

    lines: list[str] = []
    for tx in txns:
        sign = "+" if tx["type"] == "income" else "-"
        desc = f" -- {tx['description']}" if tx["description"] else ""
        lines.append(f"{tx['date']} {sign}${float(tx['amount']):,.2f} {tx['category']}{desc}")
    await update.message.reply_text("\n".join(lines))


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (update.message.text or "").strip()
    if not text:
        return

    user = await db.get_user_by_chat_id(update.effective_chat.id)
    if not user:
        await update.message.reply_text("Account not linked. Use /link <token> to connect your BudgetSphere account.")
        return

    tokens = text.split()
    raw_amount = tokens[0]

    # Determine income vs expense
    is_income = raw_amount.startswith("+")
    if is_income:
        raw_amount = raw_amount[1:]

    try:
        amount = Decimal(raw_amount)
        if amount <= 0:
            raise InvalidOperation
    except (InvalidOperation, ValueError):
        await update.message.reply_text("Couldn't parse amount. Format: `50 groceries lunch`", parse_mode="Markdown")
        return

    # Category matching
    cat_token = tokens[1] if len(tokens) > 1 else "miscellaneous"
    try:
        category = await db.match_category(user.id, cat_token)
    except Exception:
        logger.exception("category match failed")
        await update.message.reply_text("Something went wrong. Please try again.")
        return
    if not category:
        await update.message.reply_text("Something went wrong. Please try again.")
        return

    description = " ".join(tokens[2:]) if len(tokens) > 2 else None
    tx_type = "income" if is_income else "expense"

    try:
        await db.create_transaction(
            user_id=user.id,
            category_id=category.id,
            tx_type=tx_type,
            amount=amount,
            description=description,
            tx_date=date.today(),
        )
    except Exception:
        logger.exception("create transaction failed")
        await update.message.reply_text("Something went wrong. Please try again.")
        return

    sign = "+" if is_income else "-"
    desc_part = f" -- {description}" if description else ""
    await update.message.reply_text(f"{sign}${float(amount):,.2f} {category.name}{desc_part}")


def main() -> None:
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("link", cmd_link))
    app.add_handler(CommandHandler("budget", cmd_budget))
    app.add_handler(CommandHandler("recent", cmd_recent))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Bot starting...")
    app.run_polling()


if __name__ == "__main__":
    main()
