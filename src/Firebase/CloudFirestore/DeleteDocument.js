import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";
export const DeleteDocument=async(Id)=>{

await deleteDoc(doc(db, "ToDo", Id));
}