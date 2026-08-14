// ================= SIMPAN DATA =================
const btnSimpan = document.getElementById("btnSimpan");
const status = document.getElementById("status");
const namaUser = document.getElementById("namaUser");
const jabatanUser = document.getElementById("jabatanUser");

const user =
JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){
  location.href = "login.html";
  throw new Error("Belum login");
}

btnSimpan.addEventListener("click", async function () {

  const nama = document.getElementById("nama").value.toUpperCase();
  const jabatan = document.getElementById("jabatan").value.toUpperCase();
  const gmail = document.getElementById("gmail").value;

  const error = validasi();

  if(!nama){

    showToast(
      "Nama wajib diisi"
    );

    return;
  }

  if(
    !jabatan
  ){

    showToast(
      "jabatan wajib diisi"
    );

    return;
  }

  if(error){
    showToast(error);
    return;
  }

  btnSimpan.disabled = true;
  btnSimpan.innerText = "Menyimpan...";
  status.innerText = "Proses...";

  try {

  const { error } = await db
    .from("users")
    .update({
      nama: nama,
      jabatan: jabatan,
      email: gmail
    })
    .eq(
      "id_user",
      user.userId
    );

  if(error){
    throw error;
  }

  showToast(
    "Profil berhasil disimpan"
  );

  // ================= CACHE =================

  localStorage.removeItem(
    "profil_cache_" + user.userId
  );

  // cache lama yang sebelumnya dipakai dashboard
  localStorage.removeItem(
    "profil_" + user.userId
  );

  // ================= UPDATE USER LOCAL =================

  const updatedUser = {
    ...user,
    nama: nama,
    jabatan: jabatan,
    email: gmail
  };

  if(
    sessionStorage.getItem("user")
  ){

    sessionStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

  }

  if(
    localStorage.getItem("user")
  ){

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );

  }

  localStorage.setItem(
    "activeUser",
    JSON.stringify(updatedUser)
  );

  setTimeout(() => {

    location.replace(
      "dashboard.html"
    );

  }, 1000);

} catch(err) {

  console.error(
    "Simpan profil Supabase error:",
    err
  );

  showToast(
    err.message ||
    "Gagal menyimpan profil"
  );

}

});

// ================= VALIDASI =================
function validasi() {
  if (!document.getElementById("nama").value) return "Nama wajib diisi";
  return null;
}

// ================= RESET FORM =================
function resetForm(){

  document.getElementById("nama").value = "";
  document.getElementById("jabatan").value = "";
}

