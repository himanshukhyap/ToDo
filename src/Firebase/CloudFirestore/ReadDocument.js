import { collection, getDocs } from "firebase/firestore"; 
import { db } from "../FirebaseConfig";
// import { doc } from "firebase/firestore";
// import { useDispatch } from "react-redux";
// import {GetTaskList2} from "../../Redux/Actions/GetTaskListAction"
export const ReadData =async (disptach) => {

    const ToDoCollectionRef  = await getDocs(collection(db, "ToDo"));
    // const DocumentRef = await doc(db, 'ToDo', 'RyrvUXwhlyKTfFW0wGmm')
    // const DocumentRef1 = await doc(db, 'ToDo/RyrvUXwhlyKTfFW0wGmm')
    // const messageRef = doc(db, "rooms", "roomA", "messages", "message1");
    //  ToDoCollectionRef.docs.map((x)=>{return({...x.data()})})
    // ToDoCollectionRef.docs.map((x)=>{console.log({...x.data()})})
  // console.log(DocumentRef);
  // console.log(DocumentRef1);
      // disptach(GetTaskList2(ToDoCollectionRef.docs))
}




