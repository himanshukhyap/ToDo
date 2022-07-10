import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { DoneIcon } from '../../../Assest/Icon';
import { Add_Document } from '../../../Firebase/CloudFirestore/Add_Document';
var uniqid = require('uniqid');
function AddTask() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const ADDonSubmit = data => { Add_Document(data, UserStatus); setAddTask(false) }
  const [AddTask, setAddTask] = useState(false)
  const UserStatus = useSelector((state?: any) => state.UserReducer);
  return (
    <>
      {AddTask == false && (<button className='btn bg-dark text-white my-2' onClick={() => { setAddTask(true) }}>Add Task</button>)}
      <form onSubmit={handleSubmit(ADDonSubmit)} key={uniqid()}>
        <div className='w-50 d-flex my-2'>
          {AddTask == true && (<input type="text" placeholder='Write Task here' {...register("Task")} defaultValue="" className="form-control" aria-label="Text input with radio button" key={uniqid()} />)}
          {AddTask == true && (<button className='btn' type='submit'>{DoneIcon}</button>)}
        </div>
      </form>
    </>
  )
}

export default AddTask


