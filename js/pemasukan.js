// ================= helper datetime-local =================
function formatDateTimeLocal(date){

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth()+1).padStart(2,"0");
  const dd = String(date.getDate()).padStart(2,"0");
  const hh = String(date.getHours()).padStart(2,"0");
  const min = String(date.getMinutes()).padStart(2,"0");

  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

async function tampilkanGambarLama(fileId){

  if(!fileId){
    return;
  }

  const preview =
    document.getElementById("preview");

  try{

    const result =
      await getAPI({
        mode: "image",
        id: fileId
      });

    if(
      result &&
      result.base64
    ){

      preview.src =
        result.base64;

      console.log(
        "Gambar lama berhasil dimuat"
      );

    }else{

      console.warn(
        "Gambar lama tidak tersedia"
      );

    }

  }catch(err){

    console.error(
      "Gagal mengambil gambar lama:",
      err
    );

  }

}

// ======================== tanggal default hari ini ============================
document.addEventListener("DOMContentLoaded", function(){

  const trx =
    JSON.parse(
      sessionStorage.getItem("editTransaksi")
      || "null"
    );

  const inputTanggal =
    document.getElementById("tanggal");

  // MODE EDIT
  if(trx){

  // =========================================
  // DATA BUKTI LAMA
  // =========================================

  uploadedImageUrl =
    trx.url_image || "";

  uploadedFileId =
    trx.file_id || "";


  // =========================================
  // TAMPILKAN GAMBAR LAMA
  // =========================================

  if(uploadedFileId){

    tampilkanGambarLama(
      uploadedFileId
    );

  }



    // kategori
    const select =
      document.getElementById("kategori");

    const value =
      String(trx.kategori)
      .toLowerCase();

    for(const opt of select.options){

      if(
        opt.value.toLowerCase() === value
      ){
        select.value = opt.value;
        break;
      }

    }

    document.getElementById("nominal").value =
      "Rp " +
      Number(trx.nominal)
      .toLocaleString("id-ID");

    document.getElementById("catatan").value =
      trx.catatan || "";

    // tanggal edit
    inputTanggal.value =
    formatSupabaseDateTime(
      trx.timestamp
    );

    return;
  }

  // MODE TAMBAH BARU
  inputTanggal.value =
    formatDateTimeLocal(
      new Date()
    );

});

// ====================== image uploade ==========================
let uploadedImageUrl = "";
let uploadedFileId = "";

// ================== simpan pemasukan ==================
async function simpanPemasukan(){

  const btn =
    document.getElementById("btnSimpan");

  const user =
    JSON.parse(
      sessionStorage.getItem("user") ||
      localStorage.getItem("user") ||
      localStorage.getItem("activeUser")
    );

  const kategori =
    document.getElementById("kategori")
    .value.trim();

  const nominal =
    document.getElementById("nominal")
    .value;
  
  const file =
    document.getElementById("file")
    .value;

  const catatan =
    document.getElementById("catatan")
    .value.trim();

  const status =
    document.getElementById("status");
  
  const tanggalInput =
    document.getElementById("tanggal").value;


  // ================= VALIDASI =================

  if(!kategori){

    showToast(
      "Kategori wajib diisi"
    );

    return;
  }

  if(
    getNumber(nominal) <= 0
  ){

    showToast(
      "Nominal tidak valid"
    );

    return;
  }

  if(
    !document.getElementById("file").files.length &&
    !uploadedFileId
  ){

    showToast(
      "File belum ada"
    );

    return;
  }

showLoading("Menyiapkan file...");

updateUploadProgress(
    0,
    "Menyiapkan file..."
);

btn.disabled = true;
btn.innerText = "Menyimpan...";

  try{

    // ================= UPLOAD BUKTI =================

    if(
      document.getElementById("file")
      .files.length
    ){

      status.innerText =
        "Mengupload file...";

      await uploadBukti();

    }

    // ================ mode edit ========================

    const trxEdit =
      JSON.parse(
        sessionStorage.getItem(
          "editTransaksi"
        ) || "null"
      );

    const mode =
      trxEdit
        ? "updateTransaksi"
        : "tambah_pemasukan";

    // ================= DATA =================

    const data = {

      mode,

      id:
        trxEdit?.id || "",

      id_user:
        user.userId,

      jenis:
        "masuk",

      kategori:
        kategori.toLowerCase(),

      nominal:
        getNumber(nominal),

      catatan:
        catatan,
      
      tanggal: datetimeLocalToISO(tanggalInput),

      url_image:
        uploadedImageUrl,

      fileId:
        uploadedFileId

    };

    // ================= SIMPAN =================

    updateUploadProgress(
        96,
        "Menyimpan transaksi..."
    );

    const hasil =
      await simpanPemasukanSupabase(data);

    const pesan =
      "✅ Pemasukan dari <b>" +
      kategori +
      "</b> sebesar <b>Rp " +
      new Intl.NumberFormat("id-ID").format(
        getNumber(nominal)
      ) +
      "</b> berhasil disimpan.";

    if(hasil.success){

      updateUploadProgress(
          100,
          "Transaksi berhasil disimpan ✓"
      );

      btn.innerText =
        "Berhasil ✔";

      showToast(
        "Pemasukan berhasil"
      );

      status.innerHTML =
        "✅ Pemasukan dari <b>" +
        kategori +
        "</b> sebesar <b>Rp " +
        new Intl.NumberFormat(
          "id-ID"
        ).format(
          getNumber(nominal)
        ) +
        "</b> berhasil disimpan.";

      setTimeout(() => {

        resetForm();

        btn.innerText =
          "Simpan";

        btn.disabled =
          false;
        
        sessionStorage.setItem(
          "toastMessage",
          pesan
        );

        sessionStorage.removeItem(
          "editTransaksi"
        );

        localStorage.removeItem(
          "dashboard_cache_" + user.userId
        );

        localStorage.removeItem(
          "riwayat_cache_" + user.userId
        );

        window.location.href =
          "dashboard.html";

      }, 800);

    }else{

      showToast(
        hasil.message ||
        "Gagal"
      );

      btn.disabled =
        false;

      btn.innerText =
        "Simpan";

    }

  }catch(err){

    console.error(err);

    showToast(
      err.message ||
      "Error server"
    );

    btn.disabled =
      false;

    btn.innerText =
      "Simpan";

  } finally {

    hideLoading();
  }

}

// ================== format rupiah ==================
function formatInputRupiah(id){

  const input = document.getElementById(id);

  input.addEventListener("input", function () {

    let angka = this.value.replace(/\D/g, "");

    if(!angka){
      this.value = "";
      return;
    }

    this.value = "Rp " + new Intl.NumberFormat("id-ID").format(angka);

  });

}

formatInputRupiah("nominal");

// ================== kompres gambar ====================

async function compressImage(file){

  return new Promise((resolve,reject)=>{

    const reader = new FileReader();

    reader.onload = function(e){

      const img = new Image();

      img.onload = function(){

        const canvas =
          document.createElement("canvas");

        let width = img.width;
        let height = img.height;

        const maxWidth = 1200;

        if(width > maxWidth){

          height =
            height * (maxWidth / width);

          width =
            maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        canvas.toBlob(

          blob => resolve(blob),

          "image/jpeg",

          0.75

        );

      };

      img.src = e.target.result;

    };

    reader.readAsDataURL(file);

  });

}

// ================== validasi file input ==================

document.getElementById("file")
.addEventListener("change", async function(){

  const file = this.files[0];

  if(!file) return;

  const status =
    document.getElementById("status");

  const preview =
    document.getElementById("preview");

  // Validasi tipe

  const allowedTypes = [

    "image/jpeg",

    "image/png",

    "image/webp",

    "application/pdf"

  ];

  if(
    !allowedTypes.includes(file.type)
  ){

    status.innerText =
      "❌ File harus JPG, PNG, WEBP atau PDF";

    this.value = "";

    return;

  }

  try{

    status.innerText =
      "⏳ Membaca file...";

    // Preview gambar

    if(
      file.type.startsWith("image/")
    ){

      const reader =
        new FileReader();

      reader.onload =
        function(){

          preview.src =
            reader.result;

        };

      reader.readAsDataURL(
        file
      );

      status.innerText =
        "✅ Gambar siap digunakan";

    }else{

      preview.removeAttribute(
        "src"
      );

      status.innerText =
        "✅ PDF siap digunakan";

    }

  }catch(err){

    console.error(err);

    status.innerText =
      "❌ Gagal membaca file";

  }

});

// ================= UPLOAD FILE =================

async function uploadBukti(){

  const file =
    document.getElementById("file")
    .files[0];

  if(!file){
    return null;
  }


  // ================= VALIDASI =================

  const allowedTypes = [

    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"

  ];


  if(
    !allowedTypes.includes(
      file.type
    )
  ){

    throw new Error(
      "File harus JPG, PNG, WEBP atau PDF"
    );

  }


  // ================= 0% =================

  updateUploadProgress(
    0,
    "Menyiapkan file..."
  );


  let uploadFile =
    file;

  let mimeType =
    file.type;


  // ================= KOMPRES =================

  if(
    file.type.startsWith("image/")
  ){

    updateUploadProgress(
      10,
      "Mengompres gambar..."
    );


    uploadFile =
      await compressImage(file);


    mimeType =
      "image/jpeg";


    updateUploadProgress(
      25,
      "Gambar berhasil dikompres..."
    );

  }


  // ================= BASE64 =================

  updateUploadProgress(
    30,
    "Membaca file..."
  );


  const base64 =
    await blobToBase64(
      uploadFile
    );


  updateUploadProgress(
    45,
    "File siap diupload..."
  );


  // ================= UPLOAD =================

  // ==============================
  // MULAI UPLOAD
  // ==============================

  startProgressAnimation(
      50,
      90
  );


  const result =
      await postAPI({

          mode:
              "upload_file",

          fileName:
              file.name,

          mimeType:
              mimeType,

          kategori:
              document
                  .getElementById(
                      "kategori"
                  )
                  .value,

          base64:
              base64

      });


  // ==============================
  // SERVER SUDAH MERESPON
  // ==============================

  stopProgressAnimation();


  updateUploadProgress(
      95,
      "Upload selesai..."
  );


  // ================= HASIL =================

  console.log(
    "Hasil upload:",
    result
  );


  if(
    !result.ok
  ){

    throw new Error(
      result.message ||
      "Upload gagal"
    );

  }


  // ================= SELESAI =================

  updateUploadProgress(
    95,
    "Upload selesai..."
  );


  uploadedImageUrl =
    result.url;

  uploadedFileId =
    result.fileId;


  return result;

}

// ================ helper blob to base64 =================

function blobToBase64(blob){

  return new Promise((resolve)=>{

    const reader =
      new FileReader();

    reader.onloadend = ()=>{

      resolve(
        reader.result
          .split(",")[1]
      );

    };

    reader.readAsDataURL(blob);

  });

}


// ================= RESET FORM =================
function resetForm(){
  document.getElementById("kategori").value = "";
  document.getElementById("nominal").value = "";
  document.getElementById("catatan").value = "";
  document.getElementById("file").value = "";
  uploadedImageUrl = "";
  uploadedFileId = "";
}

async function simpanPemasukanSupabase(data){

  // ==================================================
  // MODE EDIT
  // ==================================================

  if(
    data.mode === "updateTransaksi"
  ){

    if(!data.id){

      throw new Error(
        "ID transaksi tidak ditemukan"
      );

    }


    const { data: hasil, error } =
      await db
        .from("transactions")
        .update({

          kategori:
            data.kategori,

          nominal:
            data.nominal,

          tanggal:
            data.tanggal,

          catatan:
            data.catatan || null,

          url_image:
            data.url_image || null,

          file_id:
            data.fileId || null

        })
        .eq(
          "id",
          data.id
        )
        .eq(
          "id_user",
          data.id_user
        )
        .select()
        .single();


    if(error){

      console.error(
        "Update transaksi error:",
        error
      );

      throw new Error(
        error.message ||
        "Gagal mengupdate transaksi"
      );

    }


    console.log(
      "Transaksi berhasil diupdate:",
      hasil
    );


    return {
      success: true,
      data: hasil
    };

  }


  // ==================================================
  // MODE TAMBAH
  // ==================================================

  const { data: hasil, error } =
    await db.rpc(
      "simpan_pemasukan",
      {
        p_id_user:
          data.id_user,

        p_kategori:
          data.kategori,

        p_nominal:
          data.nominal,

        p_tanggal:
          data.tanggal,

        p_catatan:
          data.catatan || null,

        p_url_image:
          data.url_image || null,

        p_file_id:
          data.fileId || null
      }
    );


  if(error){

    console.error(
      "Supabase RPC error:",
      error
    );

    throw new Error(
      error.message ||
      "Gagal menyimpan pemasukan"
    );

  }


  console.log(
    "Hasil RPC:",
    hasil
  );


  if(!hasil?.success){

    throw new Error(
      hasil?.message ||
      "Pemasukan gagal disimpan"
    );

  }


  return hasil;

}



function datetimeLocalToISO(value){

  if(!value){
    return null;
  }

  return value + ":00+07:00";

}

function formatSupabaseDateTime(value){

  if(!value){
    return formatDateTimeLocal(new Date());
  }

  const date = new Date(value);

  return formatDateTimeLocal(date);
}