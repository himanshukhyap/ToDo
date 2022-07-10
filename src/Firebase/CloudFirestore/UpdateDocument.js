import { deleteDoc, doc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { db } from "../FirebaseConfig";
import { DeleteDocument } from "./DeleteDocument";
var moment = require('moment');
export const UpdateDocument=async(data)=>{
let obj={};
if (data.IsEdit==true) {


    Swal.fire({
        title: 'Do you want to save the changes?',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Save',
        denyButtonText: `Don't save`,
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed) {
            try {
                 updateDoc(doc(db, "ToDo",data.all.Id), obj);
               
            } catch (e) {
                console.error("Error adding document: ", e);
            }
          Swal.fire('Saved!', '', 'success')
        } else if (result.isDenied) {
          Swal.fire('Changes are not saved', '', 'info')
        }
      })
     obj = {Task:data.Task,EditDate:Timestamp.fromDate(new Date()),}
  
    }
    if (data?.IsDelete==true) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
            if (result.isConfirmed) {
                DeleteDocument(data.all.Id)
              Swal.fire(
                'Deleted!',
                'Your file has been deleted.',
                'success'
              )
            }
          })
       
    }
    if (data.IsRadioButton==true) {
        obj = {Complete:!data.all.Complete,EditDate:Timestamp.fromDate(new Date()),}
        try {
            await updateDoc(doc(db, "ToDo",data.all.Id), obj);
           
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
 
      
}




// const cityRef = doc(db, 'cities', 'BJ');

// // Remove the 'capital' field from the document
// await updateDoc(cityRef, {
//     capital: deleteField()
// })