import React from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from '../../Firebase/Auth_Logout'
import { LoaderAction } from '../../Redux/Actions/LoaderAction'
import TaskShow from './TaskShow'

function AfterLogin() {
    
  return (
    <>
    <nav className="navbar navbar-light bg-light">
  <div className="container-fluid">
    <Link className="navbar-brand" to="/">To Do</Link>
    <li class="nav-item">
          <Link  to="/AfterLogin/Task">Task</Link>
        </li>
        <li class="nav-item">
          <Link  to="/AfterLogin/Storage">Storage</Link>
        </li>
      <button className="btn btn-danger" type="submit" onClick={LogOut}>LogOut</button>
  </div>
</nav>
    
      
    </>
   
  )
}

export default AfterLogin