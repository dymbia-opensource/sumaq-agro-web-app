import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/** File ready to be saved on the device. */
export interface ExportedFile {
  fileName: string;
  content: Blob;
}

/**
 * Saves an exported file on the device, through the download of the browser.
 */
@Injectable({ providedIn: 'root' })
export class FileDownloader {
  private readonly document = inject(DOCUMENT);

  /**
   * Starts the download of a file.
   * @param file - Name and content of the file.
   */
  save(file: ExportedFile): void {
    const url = URL.createObjectURL(file.content);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.click();
    // Give the browser time to start the download before freeing the file.
    setTimeout(() => URL.revokeObjectURL(url));
  }
}
