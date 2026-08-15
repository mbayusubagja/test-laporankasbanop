function showToast(msg) {

  const div = document.createElement("div");
  div.innerHTML = msg;

  div.style.position = "fixed";
  div.style.bottom = "20px";
  div.style.left = "50%";
  div.style.transform = "translateX(-50%)";
  div.style.background = "#333";
  div.style.color = "#fff";
  div.style.padding = "10px 20px";
  div.style.borderRadius = "8px";
  div.style.zIndex = "9999";

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 2000);

}

// button back
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("btnBack")) {
    goBack();
  }
});

function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
    clearEditMode();
  } else {
    clearEditMode();
    window.location.href = "dashboard.html"; // fallback kalau tidak ada history
  }
}

// =============== bersihkan rupiah ==================
function getNumber(value){
  return Number(value.replace(/\D/g, ""));
}

// ================ format tanggal ===================
function formatTanggal(t){

  const date = new Date(t);

  const hari = String(date.getDate()).padStart(2,"0");
  const bulan = date.toLocaleString("id-ID", { month: "short" });
  const jam = String(date.getHours()).padStart(2,"0");
  const menit = String(date.getMinutes()).padStart(2,"0");

  return `${hari} ${bulan} ${jam}:${menit}`;
}

// ===========toggle menu ==================
function toggleMenu() {
  const menu = document.getElementById("menuList");
  menu.classList.toggle("hidden");
}

function clearEditMode(){
  sessionStorage.removeItem("editTransaksi");
}

// ==============================
// LOADING
// ==============================

function showLoading(
    text = "Mohon tunggu..."
) {

    const loading =
        document.getElementById(
            "loadingProses"
        );

    const title =
        document.getElementById(
            "loadingTitle"
        );

    const loadingText =
        document.getElementById(
            "loadingText"
        );

    const progressBar =
        document.getElementById(
            "loadingProgressBar"
        );

    const percent =
        document.getElementById(
            "loadingPercent"
        );


    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }


    if (title) {

        title.innerText =
            "Memproses file...";

    }


    if (loadingText) {

        loadingText.innerText =
            text;

    }


    if (progressBar) {

        progressBar.style.width =
            "0%";

    }


    if (percent) {

        percent.innerText =
            "0%";

    }

}


// ==============================
// UPDATE PROGRESS
// ==============================

function updateUploadProgress(
    persen,
    teks = "Mohon tunggu..."
) {

    persen = Math.round(
        Math.max(
            0,
            Math.min(
                100,
                persen
            )
        )
    );

    const loadingText =
        document.getElementById(
            "loadingText"
        );

    const loadingPercent =
        document.getElementById(
            "loadingPercent"
        );

    const loadingBar =
        document.getElementById(
            "loadingProgressBar"
        );


    if (loadingText) {

        loadingText.innerText =
            teks;

    }


    if (loadingPercent) {

        loadingPercent.innerText =
            persen + "%";

    }


    if (loadingBar) {

        loadingBar.style.setProperty(
            "width",
            persen + "%",
            "important"
        );

        console.log(
            "Progress:",
            persen + "%",
            "Bar:",
            loadingBar
        );

    }

}

// ==============================
// PROGRESS ANIMASI SAAT MENUNGGU
// ==============================

let progressTimer = null;
let progressValue = 0;

function startProgressAnimation(
    mulai = 50,
    maksimal = 90,
    kecepatan = 700
) {

    // hentikan timer sebelumnya
    stopProgressAnimation();

    progressValue = mulai;

    updateUploadProgress(
        progressValue,
        "Mengupload bukti..."
    );


    progressTimer = setInterval(() => {

        /*
         * Naik perlahan.
         *
         * Semakin dekat maksimal,
         * semakin lambat.
         */

        if (
            progressValue < maksimal
        ) {

            const sisa =
                maksimal -
                progressValue;

            const kenaikan =
                Math.max(
                    0.5,
                    sisa * 0.08
                );

            progressValue +=
                kenaikan;


            updateUploadProgress(
                progressValue,
                "Mengupload bukti..."
            );

        }

    }, kecepatan);

}


// ==============================
// STOP PROGRESS ANIMASI
// ==============================

function stopProgressAnimation() {

    if (progressTimer) {

        clearInterval(
            progressTimer
        );

        progressTimer = null;

    }

}


// ==============================
// HIDE LOADING
// ==============================

function hideLoading() {

    const loading =
        document.getElementById(
            "loadingProses"
        );

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

}