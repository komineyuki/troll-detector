import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously } from "firebase/auth";
import { FieldValue, addDoc, arrayUnion, collection, doc, getCountFromServer, getDoc, getFirestore, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

export class FirebaseInfo {

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
public firebaseConfig = {
    apiKey: "AIzaSyDNHWwwpR8rwyk-dInKI3QPAKKTZ-laGWM",
    authDomain: "troll-detector-e4bc3.firebaseapp.com",
    projectId: "troll-detector-e4bc3",
    storageBucket: "troll-detector-e4bc3.appspot.com",
    messagingSenderId: "1050302733218",
    appId: "1:1050302733218:web:c284bbd2c1324dce8230fb",
    measurementId: "G-NPFR7EJ363"
};

// Initialize Firebase
public  app = initializeApp(this.firebaseConfig);
public  analytics = getAnalytics(this.app);
public  db = getFirestore(this.app);

public static uid;

public login(f:Function){

    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => {
        // Signed in..
        FirebaseInfo.uid = auth.currentUser.uid;
        if(f != null) f(FirebaseInfo.uid);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ...
      });
  }

  public async sendReport({trollID, trollType, trollRemark}) {
    try {
        await this.addReported(trollID);
        const docRef = await addDoc(collection(this.db, "Reports"), {
          date: serverTimestamp(),
          postUID: FirebaseInfo.uid,
          trollID: trollID,
          trollType: trollType,
          trollRemark: trollRemark
        });
        console.log("Document written with ID: ", docRef.id);
        return true;
      } catch (e) {
        console.error("Error adding document: ", e);
        return false;
      }
  }

  public async addReported(trollID:string){
    const myDocument = await setDoc(doc(this.db, "Users", FirebaseInfo.uid), {
        reportedTrolls: arrayUnion(trollID)
    },
    { merge: true });
  }

  // true - already reported him.
  public async checkReported(trollID:string){
    try{
        const myDocument = await getDoc(doc(this.db, "Users", FirebaseInfo.uid));
        const data = myDocument.data();
        if(myDocument.get("reportedTrolls") == null) return false;
        const trolls = data["reportedTrolls"];
        return trolls.includes(trollID);
    }catch (e){
        alert("Error checking report. " + e);
        return true;
    }
  }

  public async getReportedCount(trollID:string){
    console.log("getReportedCount()");
    try{
      const coll = collection(this.db, "Reports");
      const q = query(coll, where("trollID", "==", trollID));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    }catch(e){
      alert("ERROR: " + e);
    }
  }
}