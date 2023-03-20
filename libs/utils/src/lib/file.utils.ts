import { from, Observable } from 'rxjs';
import * as SparkMD5 from 'spark-md5';
// import CryptoJS from 'crypto-js';

export function computeChecksumMd5(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunkSize = 2 * 1024 * 1024; // Read in chunks of 2MB
		const spark = new SparkMD5.ArrayBuffer();
		const fileReader = new FileReader();

		let cursor = 0; // current cursor in file

		fileReader.onerror = function (): void {
			reject('MD5 computation failed - error reading the file');
		};

		// read chunk starting at `cursor` into memory
		function processChunk(chunk_start: number): void {
			const chunk_end = Math.min(file.size, chunk_start + chunkSize);
			fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end));
		}

		// when it's available in memory, process it
		// If using TS >= 3.6, you can use `FileReaderProgressEvent` type instead
		// of `any` for `e` variable, otherwise stick with `any`
		// See https://github.com/Microsoft/TypeScript/issues/25510
		fileReader.onload = function (e: any): void {
			spark.append(e.target.result); // Accumulate chunk to md5 computation
			cursor += chunkSize; // Move past this chunk

			if (cursor < file.size) {
				// Enqueue next chunk to be accumulated
				processChunk(cursor);
			} else {
				// Computation ended, last chunk has been processed. Return as Promise value.
				// This returns the base64 encoded md5 hash, which is what
				// Rails ActiveStorage or cloud services expect
				// resolve(btoa(spark.end(true)));

				// If you prefer the hexdigest form (looking like
				// '7cf530335b8547945f1a48880bc421b2'), replace the above line with:
				// resolve(spark.end());
				resolve(spark.end());
			}
		};

		processChunk(0);
	});
}

export function computeChecksumMd5$(file: File): Observable<string> {
	return from(computeChecksumMd5(file));
}

// function arrayBufferToWordArray(ab: ArrayBuffer): CryptoJS.lib.WordArray {
//   const i8a = new Uint8Array(ab);
//   const a = [];
//   for (let i = 0; i < i8a.length; i += 4) {
//     a.push(
//       (i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]
//     );
//   }
//   return CryptoJS.lib.WordArray.create(a, i8a.length);
// }

// export function getHash(file: File | Blob): Promise<string> {
//   return new Promise(function (resolve, reject) {
//     if (file) {
//       const hashdata = CryptoJS.algo.MD5.create();
//       const fileSize = file.size;
//       const chunk_size = Math.pow(2, 22);
//       let offset = 0;

//       const readBlob = (start: number, end: number): void => {
//         const blob = file.slice(start, end);
//         reader.readAsArrayBuffer(blob);
//       };
//       const updateHash = (fileData: ArrayBuffer): void => {
//         hashdata.update(arrayBufferToWordArray(fileData));
//       };

//       const generateFinalHash = (): string => {
//         return hashdata.finalize().toString();
//       };

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (reader.readyState == FileReader.DONE) {
//           updateHash(<ArrayBuffer>reader.result);
//           if (offset < fileSize) {
//             offset += chunk_size;
//             readBlob(offset, offset + chunk_size);
//           } else {
//             resolve(generateFinalHash());
//           }
//         }
//       };
//       readBlob(offset, offset + chunk_size);
//     } else {
//       // if no File
//       reject('File incorrect.');
//     }
//   });
// }
