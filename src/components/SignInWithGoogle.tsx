import React from "react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from "firebase/auth";
import { auth, firestore } from "../utils/firebase.ts";
import { Button } from "@material-tailwind/react";
import { useAuth } from "../context/AuthContext.tsx";
import Cookies from "js-cookie";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SignInWithGoogle: React.FC = () => {
  const { setUser } = useAuth();
  const provider = new GoogleAuthProvider();

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 7);

  const handleSignIn = async () => {
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      // const credential = GoogleAuthProvider.credentialFromResult(result);

      const user = result.user;
      const userRef = doc(firestore, "users", user.uid);
      const docSnapshot = await getDoc(userRef);
       if (!docSnapshot.exists()) {
         await setDoc(userRef, {
           uid: user.uid,
           username: user.email?.split("@")[0], 
           displayName: user.displayName,
           email: user.email,
           photoURL: user.photoURL,
           createdAt: new Date(),
         });
       }
      if (user) {
        setUser({
          name: user.displayName,
          userId: user.uid,
          picture: user.photoURL,
          email: user.email,
        });
      }

      Cookies.set("token", await user.getIdToken(), { expires: expiryDate });
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      const credential = GoogleAuthProvider.credentialFromError(error);

      console.error("Error signing in:", {
        errorCode,
        errorMessage,
        email,
        credential,
      });
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      size="sm"
      variant="outlined"
      color="blue-gray"
      className="flex items-center gap-3"
    >
      <img
        src="https://docs.material-tailwind.com/icons/google.svg"
        alt="metamask"
        className="h-6 w-6"
      />
      Continue with Google
    </Button>
  );
};

export default SignInWithGoogle;
