const user = JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if(!user){
  location.href = "login.html";
  throw new Error("Belum login");
}


const PROFIL_CACHE_KEY =
  "profil_cache_" + user.userId;

const PROFIL_CACHE_TIME =
  5 * 60 * 1000; // 5 menit


// ================= CACHE =================

function getProfilCache(){

  try{

    const cache =
      localStorage.getItem(
        PROFIL_CACHE_KEY
      );

    if(!cache) return null;

    return JSON.parse(cache);

  }catch(err){

    console.error(
      "Cache profil rusak:",
      err
    );

    localStorage.removeItem(
      PROFIL_CACHE_KEY
    );

    return null;
  }
}


function saveProfilCache(data){

  try{

    localStorage.setItem(
      PROFIL_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: data
      })
    );

  }catch(err){

    console.error(
      "Gagal menyimpan cache profil:",
      err
    );

  }
}


// ================= RENDER =================

function renderProfil(data){

  const n = data;

  document.getElementById("namaUser").innerHTML =
    n.nama || "-";

  document.getElementById("jabatanUser").innerHTML =
    n.jabatan || "-";

  document.getElementById("gmailUser").innerHTML =
    n.gmail || "-";
}


// ================= SKELETON =================

function showProfilSkeleton(){

  document.getElementById("namaUser").innerHTML =
    `<span class="skeleton skeletonProfilNama"></span>`;

  document.getElementById("jabatanUser").innerHTML =
    `<span class="skeleton skeletonProfilJabatan"></span>`;

  document.getElementById("gmailUser").innerHTML =
    `<span class="skeleton skeletonProfilGmail"></span>`;
}


// ================= LOAD PROFIL =================

async function getProfil(force = false){

  const cache = getProfilCache();

  // ============================
  // CACHE ADA
  // ============================

  if(cache && cache.data && !force){

    renderProfil(cache.data);

    const umur =
      Date.now() - cache.time;

    if(umur < PROFIL_CACHE_TIME){
      return;
    }
  }

  // ============================
  // BELUM ADA CACHE
  // ============================

  if(!cache || !cache.data){
    showProfilSkeleton();
  }

  // ============================
  // FETCH SUPABASE
  // ============================

  try{

    const {
      data,
      error
    } = await db
      .from("users")
      .select(`
        nama,
        jabatan,
        email
      `)
      .eq(
        "id_user",
        user.userId
      )
      .maybeSingle();

    if(error){
      throw error;
    }

    if(!data){
      throw new Error(
        "User tidak ditemukan"
      );
    }

    const profil = {
      nama: data.nama,
      jabatan: data.jabatan,
      gmail: data.email
    };

    saveProfilCache(profil);

    renderProfil(profil);

  }catch(err){

    console.error(
      "Profil Supabase error:",
      err
    );

    if(cache && cache.data){

      renderProfil(
        cache.data
      );

    }else{

      document.getElementById(
        "namaUser"
      ).innerText =
        "Gagal memuat";

      document.getElementById(
        "jabatanUser"
      ).innerText =
        "-";

      document.getElementById(
        "gmailUser"
      ).innerText =
        "-";
    }
  }
}


// ================= NAVIGASI =================

function aturProfil(){

  window.location.href =
    "profil.html";

}


function backProfil(){

  window.location.href =
    "dashboard.html";

}


// ================= LOAD =================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    getProfil();

  }
);