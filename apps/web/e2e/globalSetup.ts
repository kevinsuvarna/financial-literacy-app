import { writeFakeCameraFile } from './fakeCamera';

export default function globalSetup(): void {
  writeFakeCameraFile();
}
