import React from 'react'
import { useForm } from 'react-hook-form';
import { createuser } from '../../Firebase/Auth_signup';

function Registration() {
  const { register, handleSubmit } = useForm();
  const onSubmitRegister = data => { createuser(data); }
  return (
<div className="my-4 card m-auto border-0" style={{ width: "450px" }}>
<form onSubmit={handleSubmit(onSubmitRegister)}>
                <div className="my-3">
                    <input className='form-control mb-3' placeholder="Email"  {...register("Email")} />
                    <input className='form-control' placeholder="Password" {...register("Password")} />
                    <button type="submit" className="my-3 border py-3 w-100 fw-bold shadow bg-dark text-white">
                    Register
                  </button>
                </div>
            </form>
</div>
  )
}

export default Registration