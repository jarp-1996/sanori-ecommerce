import { app } from './src/lib/firebase.ts';
import { getStorage, ref, uploadString } from 'firebase/storage';

const storage = getStorage(app);
const storageRef = ref(storage, `test.txt`);

uploadString(storageRef, 'hello world').then(() => {
  console.log('Upload success');
  process.exit(0);
}).catch((e) => {
  console.error('Upload error:', e.message);
  process.exit(1);
});
