
import { collection, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import {  useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { DeleteIcon, DoneIcon, EditIcon } from '../../Assest/Icon';
import { DeleteDocument } from '../../Firebase/CloudFirestore/DeleteDocument';
import { UpdateDocument } from '../../Firebase/CloudFirestore/UpdateDocument';
import { db } from '../../Firebase/FirebaseConfig';
import AddTask from './AddTask/AddTask';

var uniqid = require('uniqid');

function TaskShow() {
  const [IsEdit, setIsEdit] = useState("")
  const [TaskList, setTaskList] = useState([])

  const UserStatus = useSelector((state) => state.UserReducer);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const onSubmit = data => { UpdateDocument(data); setIsEdit(false) }

  useEffect(() => {
    return () => {
      if (UserStatus != null) {
        try {
          onSnapshot(collection(db, "ToDo"), (data) => {

            setTaskList(data.docs)
          });
        } catch (error) {
          console.log(error);
        }
      }

    }
  }, [])

  return (
    <>
      <AddTask />
      <h1>Pending</h1>
      <form onSubmit={handleSubmit(onSubmit)} key={uniqid()}>
        {TaskList?.map((x) => {
          return [{ ...x.data(), Id: x.id }].filter(f => f.UserId == UserStatus && f.Complete == false).map((x) => {

            return (
              <div className="input-group w-50 my-2" key={uniqid()}>

                <div className="input-group-text" key={uniqid()}>

                  <button className='form-check-input' type='radio' name='RadioButton' id={x.Id} onClick={() => { setValue("all", x); setValue("IsEdit", false); setValue("IsDelete", false); setValue("IsRadioButton", true) }} key={uniqid()} />

                </div>
                {IsEdit == x.Id ? <input type="text"  {...register("Task")} className="form-control border border-dark" aria-label="Text input with radio button" defaultValue={x.Task} key={uniqid()} /> :
                  <input type="text" className="form-control" aria-label="Text input with radio button" value={x.Task} readOnly key={uniqid()} />}

                <button onClick={() => {
                  return (Swal.fire({
                    title: 'Are you sure?',
                    text: "You won't be able to revert this!",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, delete it!'
                  }).then((result) => {
                    if (result.isConfirmed) {
                      DeleteDocument(x.Id)
                      Swal.fire(
                        'Deleted!',
                        'Your file has been deleted.',
                        'success'
                      )
                    }
                  }))
                }} key={uniqid()} className="btn shadow border border-dark">{DeleteIcon}</button>
                {IsEdit == x.Id ? <button onClick={() => { setValue("all", x); setValue("IsEdit", true); setValue("IsRadioButton", false) }} key={uniqid()} className="btn shadow border border-dark" type='submit'>{DoneIcon}</button> : <button onClick={() => { setIsEdit(x.Id) }} key={uniqid()} type="button" className="btn shadow border border-dark" >{EditIcon}</button>}
              </div>

            )
          })



        })}
      </form>



      <h1>Complete</h1>

      <form onSubmit={handleSubmit(onSubmit)} key={uniqid()}>
        {TaskList?.map((x) => {
          return [{ ...x.data(), Id: x.id }].filter(f => f.UserId == UserStatus && f.Complete == true).map((x) => {

            return (


              <div className="input-group w-50 my-2" key={uniqid()}>

                <div className="input-group-text" key={uniqid()}>

                  <button className='form-check-input' type='radio' name='RadioButton' id={x.Id} onClick={() => { setValue("all", x); setValue("IsEdit", false); setValue("IsRadioButton", true) }} key={uniqid()} />
                </div>
                {IsEdit == x.Id ? <input type="text"  {...register("Task")} className="form-control" aria-label="Text input with radio button" defaultValue={x.Task} key={uniqid()} /> :
                  <input type="text" className="form-control text-decoration-line-through" aria-label="Text input with radio button" value={x.Task} readOnly key={uniqid()} />}

                <button onClick={() => { DeleteDocument(x.Id) }} key={uniqid()} className="btn shadow border border-dark">{DeleteIcon}</button>
                {IsEdit == x.Id ? <button onClick={() => { setValue("all", x); setValue("IsEdit", true); setValue("IsRadioButton", false) }} key={uniqid()} className="btn shadow border border-dark"  type='submit'>{DoneIcon}</button> : <button onClick={() => { setIsEdit(x.Id) }} key={uniqid()} type="button" className="btn shadow border border-dark" >{EditIcon}</button>}
              </div>

            )
          })
        })}
      </form>
    </>

  )
}

export default TaskShow