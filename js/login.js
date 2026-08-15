(function(){

    if(
      localStorage.getItem("activeUser")
    ){
      location.href = "dashboard.html";
    }

})();

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

function togglePass(){

  const p =
    document.getElementById("password");

  p.type =
    p.type === "password"
    ? "text"
    : "password";
}

function togglePassBaru(){

  const p =
    document.getElementById("passwordBaru");

  p.type =
    p.type === "password"
    ? "text"
    : "password";
}

function hashPassword(password) {
  return sha256(password);
}

function bukaRegister() {
  registerBtn.classList.remove("hidden");
  loginBtn.classList.add("hidden");
  document.getElementById("bukaRegister").classList.add("hidden");
    document.getElementById("bukaLogin").classList.remove("hidden");

}

function bukaLogin() {
  registerBtn.classList.add("hidden");
  loginBtn.classList.remove("hidden");
  document.getElementById("bukaLogin").classList.add("hidden");
  document.getElementById("bukaRegister").classList.remove("hidden");
}

// ================================ validasi ==================================

function validasi() {
  const password = document.getElementById("password").value.trim();
  const noHpRaw = document.getElementById("noHp").value.trim();

  if (!password) {
    return "Password wajib diisi";
  }

  if (!noHpRaw) {
    return "No HP wajib diisi";
  }

  const noHp = formatNomorHP(noHpRaw);

  if (noHp.length < 10) {
    return "Nomor HP tidak valid";
  }

  return null;
}



async function login(){

  const error = validasi();

  if(error){
    status(error);
    return;
  }

  const loginBtn =
    document.getElementById("loginBtn");

  const noHpRaw =
    document
      .getElementById("noHp")
      .value
      .trim();

  const noHp =
    formatNomorHP(noHpRaw);

  const password =
    document
      .getElementById("password")
      .value
      .trim();

  status("Sedang login...");

  loginBtn.disabled = true;
  registerBtn.disabled = true;
  loginBtn.innerText = "Memproses...";

  try{

    // ================= HASH PASSWORD =================

    const passHash =
      await hashPassword(password);


    // ================= CARI USER =================

    const {
      data,
      error
    } = await db
      .from("users")
      .select(`
        id_user,
        no_hp,
        role,
        nama,
        jabatan,
        email,
        pass_hash
      `)
      .eq("no_hp", noHp)
      .maybeSingle();


    if(error){

      console.error(
        "Login Supabase error:",
        error
      );

      throw error;
    }


    // ================= USER TIDAK DITEMUKAN =================

    if(!data){

      status(
        "❌ Nomor HP atau password salah"
      );

      return;
    }


    // ================= CEK PASSWORD =================

    if(data.pass_hash !== passHash){

      status(
        "❌ Nomor HP atau password salah"
      );

      return;
    }


    // ================= USER BERHASIL LOGIN =================

    const user = {

      userId:
        data.id_user,

      noHp:
        data.no_hp,

      role:
        data.role,

      nama:
        data.nama,

      jabatan:
        data.jabatan,

      email:
        data.email

    };


    // ================= CEK AKUN AKTIF =================

    const activeUserId =
      localStorage.getItem(
        "activeUserId"
      );


    if(
      activeUserId &&
      activeUserId !== user.userId
    ){

      status(
        `❌ Masih ada akun lain yang aktif di browser ini.
        Logout terlebih dahulu akun tersebut
        <b>dengan menonaktifkan Always Login.</b>`
      );

      return;
    }


    const currentUser =
      JSON.parse(
        sessionStorage.getItem("user") ||
        localStorage.getItem("user") ||
        "null"
      );


    if(
      currentUser &&
      currentUser.userId !== user.userId
    ){

      status(
        `❌ Masih ada akun lain yang aktif di browser ini.
        Logout terlebih dahulu akun tersebut
        <b>dengan menonaktifkan Always Login.</b>`
      );

      return;
    }


    // ================= REMEMBER LOGIN =================

    const keepLogin =
      localStorage.getItem(
        "rememberLogin"
      ) === "true";


    if(keepLogin){

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

    }else{

      sessionStorage.setItem(
        "user",
        JSON.stringify(user)
      );

    }


    // ================= AKUN AKTIF =================

    localStorage.setItem(
      "activeUserId",
      user.userId
    );

    localStorage.setItem(
      "activeUser",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "lastActivity",
      Date.now()
    );


    status(
      "✅ Login berhasil"
    );


    setTimeout(() => {

      location.href =
        "dashboard.html";

    }, 500);


  }catch(err){

    console.error(
      "Login error:",
      err
    );

    status(
      "❌ Tidak dapat terhubung ke server"
    );

  }finally{

    loginBtn.disabled = false;
    registerBtn.disabled = false;

    loginBtn.innerText =
      "Login";

  }

}



async function register(){

  const error = validasi();

  if(error){
    status(error);
    return;
  }


  const registerBtn =
    document.getElementById(
      "registerBtn"
    );


  const noHpRaw =
    document
      .getElementById("noHp")
      .value
      .trim();


  const noHp =
    formatNomorHP(noHpRaw);


  const password =
    document
      .getElementById("password")
      .value
      .trim();


  if(password.length < 6){

    status(
      "Password minimal 6 karakter"
    );

    return;
  }


  status(
    "Sedang register..."
  );


  registerBtn.disabled = true;
  loginBtn.disabled = true;

  registerBtn.innerText =
    "Memproses...";


  try{

    // ================= HASH PASSWORD =================

    const passHash =
      await hashPassword(password);


    // ================= INSERT USER =================

    const {
      data,
      error: insertError
    } = await db

      .from("users")

      .insert({

        no_hp:
          noHp,

        pass_hash:
          passHash,

        role:
          "user",

        created_at:
          new Date().toISOString()

      })

      .select(`
        id_user,
        no_hp,
        role,
        nama,
        jabatan,
        email
      `)
      
      .single();


    // ================= ERROR =================

    if(insertError){

      console.error(
        "Register Supabase error:",
        insertError
      );


      // nomor HP sudah digunakan
      if(
        insertError.code === "23505"
      ){

        status(
          "❌ Nomor HP sudah terdaftar"
        );

        return;
      }


      throw insertError;
    }


    // ================= BERHASIL =================

    console.log(
      "User berhasil dibuat:",
      data
    );


        // =========================
        // Register berhasil
        // =========================

        status(
            data.message ||
            "Register berhasil, silakan login."
        );
        
        bukaLogin();


  }catch(err){

    console.error(
      "Register error:",
      err
    );


    status(
      "❌ " +
      (
        err.message ||
        "Gagal melakukan register"
      )
    );


  }finally{

    registerBtn.disabled = false;
    loginBtn.disabled = false;

    registerBtn.innerText =
      "Register";

  }

}



function status(teks){

  document.getElementById("status")
    .innerHTML = teks;
}

// =============================== LUPA PASS ===================================
function bukaModalLupaPassword(){

  document.getElementById(
    "modalLupaPassword"
  ).style.display = "block";

}

function tutupModalLupaPassword(){

  document.getElementById(
    "modalLupaPassword"
  ).style.display = "none";

  document.getElementById(
    "stepOtp"
  ).style.display = "none";

  document.getElementById(
    "stepPassword"
  ).style.display = "none";

  document.getElementById(
    "gmailReset"
  ).value = "";

  document.getElementById(
    "otpReset"
  ).value = "";

  document.getElementById(
    "passwordBaru"
  ).value = "";

}

// ============================ kirim otp reset ========================

async function kirimOtpReset(){

  let gmail =
    document.getElementById("gmailReset")
      .value
      .trim()
      .toLowerCase();

  if(!gmail){
    alert("Masukkan Gmail");
    return;
  }

  try {

    // ==========================================
    // CARI USER DI SUPABASE
    // ==========================================

    const {
      data: user,
      error
    } = await db
      .from("users")
      .select("id_user, email")
      .eq("email", gmail)
      .maybeSingle();

    if(error){

      console.error(
        "Cari user:",
        error
      );

      alert(
        "Terjadi kesalahan saat mencari akun"
      );

      return;
    }

    if(!user){

      alert(
        "Email tidak ditemukan"
      );

      return;
    }


    // ==========================================
    // SIMPAN USER YANG AKAN DI-RESET
    // ==========================================

    sessionStorage.setItem(
      "resetUserId",
      user.id_user
    );

    sessionStorage.setItem(
      "resetEmail",
      gmail
    );

    // reset status OTP lama
    sessionStorage.removeItem(
      "resetOtpVerified"
    );


    // ==========================================
    // KIRIM OTP VIA APPS SCRIPT
    // ==========================================

    const data = await postAPI({

      mode:
        "kirimOtpReset",

      gmail:
        gmail

    });


    alert(
      data.message ||
      data.msg ||
      "OTP telah dikirim"
    );


    if(data.success){

      document.getElementById(
        "stepOtp"
      ).style.display = "block";

    }

  } catch(err){

    console.error(
      "Kirim OTP:",
      err
    );

    alert(
      "Tidak dapat terhubung ke server"
    );

  }

}

// =========================== verifikasi otp reset =========================

async function verifikasiOtpReset(){

  const gmail =
    sessionStorage.getItem(
      "resetEmail"
    );

  const userId =
    sessionStorage.getItem(
      "resetUserId"
    );

  const otp =
    document.getElementById(
      "otpReset"
    ).value
    .trim();


  if(!gmail || !userId){

    alert(
      "Sesi reset password tidak ditemukan. Silakan ulangi."
    );

    return;
  }


  if(!otp){

    alert(
      "Masukkan kode OTP"
    );

    return;
  }


  try {

    const data = await postAPI({

      mode:
        "verifikasiOtpReset",

      gmail:
        gmail,

      otp:
        otp

    });


    if(data.ok){

      // ======================================
      // OTP VALID
      // ======================================

      sessionStorage.setItem(
        "resetOtpVerified",
        "true"
      );


      // tampilkan form password baru
      document.getElementById(
        "stepPassword"
      ).style.display = "block";


      // optional: sembunyikan OTP
      // document.getElementById("stepOtp").style.display = "none";


    }else{

      // kalau OTP salah
      sessionStorage.removeItem(
        "resetOtpVerified"
      );

      alert(
        data.msg ||
        "OTP tidak valid"
      );

    }

  } catch(err){

    console.error(
      "Verifikasi OTP:",
      err
    );

    alert(
      "Gagal memverifikasi OTP"
    );

  }

}

// =================== simpan pass ==========================

async function simpanPasswordBaru(){

  const userId =
    sessionStorage.getItem(
      "resetUserId"
    );

  const otpVerified =
    sessionStorage.getItem(
      "resetOtpVerified"
    );


  // ==========================================
  // CEK VERIFIKASI OTP
  // ==========================================

  if(!userId){

    alert(
      "Data akun reset tidak ditemukan. Silakan ulangi proses lupa password."
    );

    return;
  }


  if(otpVerified !== "true"){

    alert(
      "Silakan verifikasi OTP terlebih dahulu"
    );

    return;
  }


  // ==========================================
  // PASSWORD BARU
  // ==========================================

  const password =
    document.getElementById(
      "passwordBaru"
    ).value.trim();


  if(password.length < 6){

    alert(
      "Password minimal 6 karakter"
    );

    return;
  }


  try {

    // ========================================
    // HASH PASSWORD
    // ========================================

    const passHash =
      await hashPassword(
        password
      );


    // ========================================
    // UPDATE SUPABASE
    // ========================================

    const {
      error
    } = await db

      .from("users")

      .update({

        pass_hash:
          passHash

      })

      .eq(
        "id_user",
        userId
      );


    if(error){

      console.error(
        "Update password:",
        error
      );

      alert(
        "Gagal mengubah password"
      );

      return;
    }


    // ========================================
    // BERHASIL
    // ========================================

    alert(
      "Password berhasil diubah"
    );


    // ========================================
    // BERSIHKAN SESSION RESET
    // ========================================

    sessionStorage.removeItem(
      "resetUserId"
    );

    sessionStorage.removeItem(
      "resetEmail"
    );

    sessionStorage.removeItem(
      "resetOtpVerified"
    );


    tutupModalLupaPassword();


  } catch(err){

    console.error(
      "Reset password:",
      err
    );

    alert(
      "Terjadi kesalahan saat mengubah password"
    );

  }

}

// ================ toggle pass baru ====================
function togglePasswordBaru(){

  const p =
    document.getElementById(
      "passwordBaru"
    );

  const btn =
    document.getElementById(
      "togglePasswordBaru"
    );

  if(p.type === "password"){

    p.type = "text";
    btn.innerText =
      "🙈 Sembunyikan Password";

  }else{

    p.type = "password";
    btn.innerText =
      "👁 Lihat Password";

  }

}

// ======================= format no hp sudah diawali 62 =======================

function formatNomorHP(input) {
  let nomor = input.trim();
  nomor = nomor.replace(/\D/g, '');

  if (nomor.startsWith('0')) {
    nomor = '62' + nomor.slice(1);
  } else if (!nomor.startsWith('62')) {
    nomor = '62' + nomor;
  }

  return nomor;
}