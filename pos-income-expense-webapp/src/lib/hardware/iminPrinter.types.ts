/** iMin JS Printer SDK (global from /vendor/imin-printer.js) */

export type IminConnectType = "USB" | "SPI" | "Bluetooth";

export interface IminPrinterStatus {
  value: string | number;
  text?: string;
}

export interface IminPrinterInstance {
  connect(): Promise<boolean>;
  initPrinter(connectType?: IminConnectType): void;
  getPrinterStatus(connectType?: IminConnectType): Promise<IminPrinterStatus>;
  setAlignment(alignment: 0 | 1 | 2): void;
  setTextSize(size: number): void;
  setTextStyle(style: 0 | 1 | 2 | 3): void;
  setTextLineSpacing(space: number): void;
  setTextWidth(width: number): void;
  setPageFormat(format: 0 | 1): void;
  printText(text: string, type?: 0 | 1): void;
  printColumnsText(
    colTextArr: string[],
    colWidthArr: number[],
    colAlignArr: number[],
    size: number[],
    width: number
  ): void;
  printAndFeedPaper(height: number): void;
  printAndLineFeed(): void;
  partialCut(): void;
  openCashBox(): void;
}

export interface IminPrinterConstructor {
  new (address?: string): IminPrinterInstance;
  PrintConnectType?: {
    USB: IminConnectType;
    SPI: IminConnectType;
    Bluetooth: IminConnectType;
  };
}

declare global {
  interface Window {
    IminPrinter?: IminPrinterConstructor;
  }
}
