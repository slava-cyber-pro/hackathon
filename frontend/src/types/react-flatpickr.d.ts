declare module "react-flatpickr" {
  import { Component } from "react";
  import { Options } from "flatpickr/dist/types/options";

  interface Props {
    value?: string | Date | Date[];
    onChange?: (dates: Date[], dateStr: string) => void;
    options?: Options;
    className?: string;
    placeholder?: string;
    [key: string]: unknown;
  }

  export default class Flatpickr extends Component<Props> {}
}
