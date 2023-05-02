let process: NodeJS.ProcessEnv | undefined;

const p = process?.env ? process.env : import.meta.env;

export const firebaseClientConfig = {
  //@ts-ignore
  apiKey: p.VITE_FIREBASE_APIKEY,
  //@ts-ignore
  authDomain: p.VITE_FIREBASE_AUTHDOMAIN,
  //@ts-ignore
  projectId: p.VITE_FIREBASE_PROJECTID,
  //@ts-ignore
  storageBucket: p.VITE_FIREBASE_STORAGEBUCKET,
  //@ts-ignore
  messagingSenderId: p.VITE_FIREBASE_MESSAGINGSENDERID,
  //@ts-ignore
  appId: p.VITE_FIREBASE_APPID,
  //@ts-ignore
  measurementId: p.VITE_FIREBASE_MEASUREMENTID,
};

export const sendgridConfig = {
  //@ts-ignore
  apiKey: p.VITE_SENDGRID_API_KEY,
};
