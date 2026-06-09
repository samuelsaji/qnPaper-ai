import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "placeholder-api-key",
  authDomain: "placeholder-auth-domain",
  projectId: "placeholder-project-id",
  storageBucket: "placeholder-storage-bucket",
  messagingSenderId: "placeholder-sender-id",
  appId: "placeholder-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
