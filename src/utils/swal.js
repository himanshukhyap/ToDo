import Swal from "sweetalert2";

function base() {
  const dark = document.documentElement.getAttribute("data-theme") !== "light";
  return {
    background: dark ? "#1a1d27" : "#ffffff",
    color:      dark ? "#e2e8f0" : "#0f172a",
    confirmButtonColor: "#6366f1",
    customClass: {
      popup:         "swal-popup",
      confirmButton: "swal-confirm",
      cancelButton:  "swal-cancel",
    },
  };
}

export async function confirmDelete(itemName = "this item") {
  const r = await Swal.fire({
    ...base(),
    title: "Delete?",
    html:  `Are you sure you want to delete <b>${itemName}</b>?<br/><small style="color:#94a3b8">This cannot be undone.</small>`,
    icon:  "warning",
    showCancelButton:  true,
    confirmButtonText: "Yes, delete",
    cancelButtonColor: "#6b7280",
    cancelButtonText:  "Cancel",
    reverseButtons:    true,
    focusCancel:       true,
  });
  return r.isConfirmed;
}

export async function confirmLogout() {
  const r = await Swal.fire({
    ...base(),
    title: "Sign out?",
    text:  "You'll be signed out of NoteTask.",
    icon:  "question",
    showCancelButton:  true,
    confirmButtonText: "Yes, sign out",
    cancelButtonColor: "#6b7280",
    cancelButtonText:  "Stay",
    reverseButtons:    true,
    focusCancel:       true,
  });
  return r.isConfirmed;
}

export function toast(icon, title) {
  Swal.fire({
    ...base(),
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    icon,
    title,
  });
}

export function errorAlert(message) {
  Swal.fire({
    ...base(),
    title: "Error",
    text:  message,
    icon:  "error",
    confirmButtonText: "OK",
  });
}
