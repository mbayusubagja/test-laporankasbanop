// ============================================================
// RIWAYAT TRANSAKSI
// SUPABASE = DATA TRANSAKSI
// APPS SCRIPT = HANYA GAMBAR GOOGLE DRIVE
// ============================================================

let activeBulan = null;
let activeCard = null;

let limitTanggal = 5;
let totalTanggal = 0;
let dataBulanAktif = [];

const limitTransaksiMap = {};
const imageCache = {};


// ============================================================
// USER
// ============================================================

const user = JSON.parse(
  sessionStorage.getItem("user") ||
  localStorage.getItem("user") ||
  localStorage.getItem("activeUser")
);

if (!user) {
  location.href = "login.html";
}


// ============================================================
// CACHE
// ============================================================

const RIWAYAT_CACHE_KEY =
  "riwayat_cache_" + user.userId;

const RIWAYAT_CACHE_TIME =
  30 * 1000; // 30 detik

let riwayatLoading = false;


// ============================================================
// GET CACHE
// ============================================================

function getRiwayatCache() {

  try {

    const cache =
      localStorage.getItem(
        RIWAYAT_CACHE_KEY
      );

    if (!cache) {
      return null;
    }

    return JSON.parse(cache);

  } catch (err) {

    console.error(
      "Cache riwayat rusak:",
      err
    );

    localStorage.removeItem(
      RIWAYAT_CACHE_KEY
    );

    return null;
  }
}


// ============================================================
// SAVE CACHE
// ============================================================

function saveRiwayatCache(data) {

  try {

    localStorage.setItem(
      RIWAYAT_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        data: data
      })
    );

  } catch (err) {

    console.error(
      "Gagal menyimpan cache riwayat:",
      err
    );

  }

}


// ============================================================
// CLEAR CACHE
// ============================================================

function clearRiwayatCache() {

  localStorage.removeItem(
    RIWAYAT_CACHE_KEY
  );

}


// ============================================================
// SKELETON
// ============================================================

function showRiwayatSkeleton() {

  const listBulan =
    document.getElementById(
      "listBulan"
    );

  if (listBulan) {

    listBulan.innerHTML = `
      <div class="skeletonBulan"></div>
      <div class="skeletonBulan"></div>
      <div class="skeletonBulan"></div>
      <div class="skeletonBulan"></div>
      <div class="skeletonBulan"></div>
    `;

  }


  const totalMasuk =
    document.getElementById(
      "totalMasuk"
    );

  const totalKeluar =
    document.getElementById(
      "totalKeluar"
    );

  const sisaSaldo =
    document.getElementById(
      "sisaSaldo"
    );


  if (totalMasuk) {

    totalMasuk.innerHTML =
      `<span class="skeletonSummary"></span>`;

  }


  if (totalKeluar) {

    totalKeluar.innerHTML =
      `<span class="skeletonSummary"></span>`;

  }


  if (sisaSaldo) {

    sisaSaldo.innerHTML =
      `<span class="skeletonSummary"></span>`;

  }

}


// ============================================================
// FORMAT RUPIAH
// ============================================================

function formatRupiah(angka) {

  return "Rp " +
    Number(angka || 0)
      .toLocaleString("id-ID");

}


// ============================================================
// PARSE TANGGAL
// ============================================================

function parseTanggal(trx) {

  if (
    !trx ||
    trx.timestamp == null
  ) {

    return new Date(NaN);

  }

  const value =
    trx.timestamp;


  // Unix timestamp

  if (
    typeof value === "number" ||
    /^\d+$/.test(String(value))
  ) {

    return new Date(
      Number(value)
    );

  }


  return new Date(value);

}


// ============================================================
// FORMAT JAM
// ============================================================

function formatJam(trx) {

  return parseTanggal(trx)
    .toLocaleTimeString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


// ============================================================
// FORMAT TANGGAL
// ============================================================

function formatTanggalIndonesia(
  tanggal
) {

  const date =
    new Date(tanggal);

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta"
    }
  );

}


// ============================================================
// NAMA BULAN
// ============================================================

function namaBulan(key) {

  const bulan = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"

  ];


  const pecah =
    key.split("-");


  return (
    bulan[
      Number(pecah[1]) - 1
    ] +
    " " +
    pecah[0]
  );

}


// ============================================================
// DEFAULT PERIODE LAPORAN
// ============================================================

function formatDatetimeLocal(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const hour =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minute =
    String(
      date.getMinutes()
    ).padStart(2, "0");


  return (
    `${year}-${month}-${day}` +
    `T${hour}:${minute}`
  );

}


function setDefaultPeriodeLaporan() {

  const now =
    new Date();


  const awalBulan =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );


  const inputAwal =
    document.getElementById(
      "waktuAwal"
    );

  const inputAkhir =
    document.getElementById(
      "waktuAkhir"
    );


  if (inputAwal) {

    inputAwal.value =
      formatDatetimeLocal(
        awalBulan
      );

  }


  if (inputAkhir) {

    inputAkhir.value =
      formatDatetimeLocal(
        now
      );

  }

}


// ============================================================
// LOAD RIWAYAT DARI SUPABASE
// ============================================================

async function getRiwayatSupabase(){

  const { data, error } = await db
    .from("transactions")
    .select(`
      id,
      id_user,
      jenis,
      kategori,
      nominal,
      tanggal,
      catatan,
      url_image,
      file_id
    `)
    .eq("id_user", user.userId)
    .order("tanggal", {
      ascending: false
    });

  if(error){

    console.error(
      "Supabase riwayat error:",
      error
    );

    throw new Error(
      error.message ||
      "Gagal mengambil riwayat"
    );

  }

  const bulan = {};

  (data || []).forEach(trx => {

    const date = new Date(trx.tanggal);

    if(isNaN(date.getTime())){
      return;
    }

    const key =
      date.getFullYear() +
      "-" +
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    if(!bulan[key]){
      bulan[key] = [];
    }

    bulan[key].push({

      id: trx.id,

      id_user: trx.id_user,

      jenis: trx.jenis,

      kategori:
        trx.kategori || "Lainnya",

      nominal:
        Number(trx.nominal) || 0,

      catatan:
        trx.catatan || "",

      // TAMBAHKAN INI
      tanggal:
        trx.tanggal,

      timestamp:
        trx.tanggal,

      url_image:
        trx.url_image || "",

      file_id:
        trx.file_id || ""

    });

  });

  return {
    ok: true,
    bulan: bulan
  };

}


// ============================================================
// LOAD RIWAYAT
// ============================================================

async function loadRiwayat(
  force = false
) {

  if (riwayatLoading) {
    return;
  }


  const cache =
    getRiwayatCache();


  // ==========================================================
  // CACHE FRESH
  // ==========================================================

  if (
    cache &&
    cache.data &&
    !force
  ) {

    const umur =
      Date.now() -
      cache.time;


    if (
      umur <
      RIWAYAT_CACHE_TIME
    ) {

      renderRiwayat(
        cache.data
      );

      return;

    }


    // Cache lama
    // tampilkan dahulu

    renderRiwayat(
      cache.data
    );

  } else {

    showRiwayatSkeleton();

  }


  // ==========================================================
  // FETCH SUPABASE
  // ==========================================================

  riwayatLoading = true;


  try {

    const hasil =
      await getRiwayatSupabase();


    if (!hasil.ok) {

      throw new Error(
        hasil.message ||
        "Gagal mengambil riwayat"
      );

    }


    saveRiwayatCache(
      hasil
    );


    renderRiwayat(
      hasil
    );


  } catch (err) {

    console.error(
      "Riwayat error:",
      err
    );


    if (
      cache &&
      cache.data
    ) {

      renderRiwayat(
        cache.data
      );

    } else {

      const listBulan =
        document.getElementById(
          "listBulan"
        );


      if (listBulan) {

        listBulan.innerHTML =
          `<p>Gagal memuat riwayat transaksi.</p>`;

      }


      showToast(
        "Gagal load riwayat transaksi"
      );

    }

  } finally {

    riwayatLoading = false;

  }

}


// ============================================================
// RENDER RIWAYAT
// ============================================================

function renderRiwayat(
  hasil
) {

  renderSummaryRiwayat(
    hasil
  );


  const listTanggal =
    document.getElementById(
      "listTanggal"
    );

  const listKategori =
    document.getElementById(
      "listKategori"
    );

  const cardListTanggal =
    document.getElementById(
      "cardListTanggal"
    );


  if (listTanggal) {

    listTanggal.innerHTML = "";

  }


  if (listKategori) {

    listKategori.innerHTML = "";

  }


  if (cardListTanggal) {

    cardListTanggal.style.display =
      "none";

  }


  const listBulan =
    document.getElementById(
      "listBulan"
    );


  if (!listBulan) {
    return;
  }


  listBulan.innerHTML = "";


  activeBulan = null;
  activeCard = null;


  const bulanKeys =
    Object.keys(
      hasil.bulan || {}
    )
    .sort(
      (a, b) =>
        b.localeCompare(a)
    );


  if (
    bulanKeys.length === 0
  ) {

    listBulan.innerHTML =
      `<p>Belum ada transaksi</p>`;

    return;

  }


  bulanKeys.forEach(
    key => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "card";

      card.style.cursor =
        "pointer";

      card.style.marginBottom =
        "10px";


      card.innerHTML = `
        <strong>
          ${namaBulan(key)}
        </strong>
      `;


      card.onclick = () => {

        limitTanggal = 5;


        const cardListTanggal =
          document.getElementById(
            "cardListTanggal"
          );


        if (
          activeCard &&
          activeCard !== card
        ) {

          activeCard.classList.remove(
            "cardBulanAktif"
          );

        }


        // TOGGLE

        if (
          activeBulan === key
        ) {

          activeBulan = null;

          card.classList.remove(
            "cardBulanAktif"
          );

          activeCard = null;


          document.getElementById(
            "listTanggal"
          ).innerHTML = "";


          cardListTanggal.style.display =
            "none";


          return;

        }


        activeBulan = key;

        card.classList.add(
          "cardBulanAktif"
        );

        activeCard = card;


        cardListTanggal.style.display =
          "block";


        // ====================================================
        // SUMMARY BULAN
        // ====================================================

        let totalMasuk = 0;
        let totalKeluar = 0;


        hasil.bulan[key]
          .forEach(
            trx => {

              if (
                trx.jenis === "masuk"
              ) {

                totalMasuk +=
                  Number(
                    trx.nominal
                  );

              }


              if (
                trx.jenis === "keluar"
              ) {

                totalKeluar +=
                  Number(
                    trx.nominal
                  );

              }

            }
          );


        document.getElementById(
          "listTanggal"
        ).innerHTML = `

          <div class="summaryBulanan">

            <div class="summaryCard masuk">

              <div>Pemasukan</div>

              <strong>
                ${formatRupiah(
                  totalMasuk
                )}
              </strong>

            </div>


            <div class="summaryCard keluar">

              <div>Pengeluaran</div>

              <strong>
                ${formatRupiah(
                  totalKeluar
                )}
              </strong>

            </div>

          </div>

        `;


        renderTanggal(
          hasil.bulan[key]
        );


        renderKategori(
          hasil.bulan[key]
        );

      };


      listBulan.appendChild(
        card
      );

    }
  );

}


// ============================================================
// GROUP BY TANGGAL
// ============================================================

function groupByTanggal(
  data
) {

  const hasil = {};


  data.forEach(
    trx => {

      const date =
        parseTanggal(
          trx
        );


      if (
        isNaN(
          date.getTime()
        )
      ) {
        return;
      }


      const parts =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          }
        ).formatToParts(date);


      const tahun =
        parts.find(
          x => x.type === "year"
        ).value;

      const bulan =
        parts.find(
          x => x.type === "month"
        ).value;

      const hari =
        parts.find(
          x => x.type === "day"
        ).value;


      const key =
        `${tahun}-${bulan}-${hari}`;


      if (!hasil[key]) {

        hasil[key] = [];

      }


      hasil[key].push(
        trx
      );

    }
  );


  return hasil;

}


// ============================================================
// RENDER TANGGAL
// ============================================================

function renderTanggal(
  data
) {

  dataBulanAktif =
    data;


  const oldBtn =
    document.getElementById(
      "btnLoadMoreTanggal"
    );


  if (oldBtn) {
    oldBtn.remove();
  }


  const list =
    document.getElementById(
      "listTanggal"
    );


  const oldTanggal =
    list.querySelectorAll(
      ".tanggalCard"
    );


  oldTanggal.forEach(
    el => el.remove()
  );


  const grup =
    groupByTanggal(
      data
    );


  const daftarTanggal =
    Object.keys(grup)
      .sort(
        (a, b) =>
          b.localeCompare(a)
      );


  totalTanggal =
    daftarTanggal.length;


  daftarTanggal
    .slice(
      0,
      limitTanggal
    )
    .forEach(
      tanggal => {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "card tanggalCard";


        card.style.cursor =
          "pointer";

        card.style.marginBottom =
          "10px";


        card.innerHTML = `

          <strong>
            ${formatTanggalIndonesia(
              tanggal
            )}
          </strong>

          <div
            id="transaksi-${tanggal}"
            style="margin-top:10px;">
          </div>

        `;


        card.onclick = () => {

          renderTransaksi(
            grup[tanggal],
            tanggal
          );

        };


        list.appendChild(
          card
        );

      }
    );


  updateButtonLoadMoreTanggal();

}


// ============================================================
// RENDER TRANSAKSI
// ============================================================

function renderTransaksi(
  data,
  tanggal,
  forceRender = false
) {

  if (
    !limitTransaksiMap[tanggal]
  ) {

    limitTransaksiMap[tanggal] =
      5;

  }


  const container =
    document.getElementById(
      "transaksi-" + tanggal
    );


  if (!container) {
    return;
  }


  if (
    !forceRender &&
    container.innerHTML.trim() !== ""
  ) {

    container.innerHTML =
      "";

    return;

  }


  container.innerHTML =
    "";


  const tampil =
    [...data]

      .sort(
        (a, b) =>
          parseTanggal(b) -
          parseTanggal(a)
      )

      .slice(
        0,
        limitTransaksiMap[tanggal]
      );


  tampil.forEach(
    trx => {

      let warna =
        "#222";


      if (
        trx.jenis === "masuk"
      ) {

        warna =
          "#22c55e";

      }


      if (
        trx.jenis === "keluar"
      ) {

        warna =
          "#ef4444";

      }


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "transaksiItem";


      item.innerHTML = `

        <div
          class="transaksiHeader"
          style="
            border-bottom:1px solid #eee;
            padding-bottom:10px;
            margin-bottom:10px;
          "
        >

          <div>

            ${formatJam(trx)}
            <br>

            <strong>
              ${trx.kategori || "Lainnya"}
            </strong>

            <div class="jenis">
              <br>
              Keterangan :
              ${trx.catatan || "-"}
            </div>

          </div>


          <div style="text-align:right;">

            <div
              class="nominal"
              style="color:${warna}"
            >

              ${formatRupiah(
                trx.nominal
              )}

            </div>

          </div>

        </div>

      `;


      item.style.cursor =
        "pointer";


      item.onclick =
        e => {

          e.stopPropagation();

          openModal(
            trx
          );

        };


      container.appendChild(
        item
      );

    }
  );


  updateButtonLoadMore(
    data,
    tanggal
  );

}


// ============================================================
// MODAL DETAIL TRANSAKSI
// ============================================================

async function openModal(
  trx
) {

  window.trxAktif =
    trx;


  document.getElementById(
    "modalContent"
  ).innerHTML = `

    <div
      style="
        text-align:center;
        padding:20px;
        color:#666;
      "
    >

      <div class="spinner"></div>

      Memuat bukti transaksi...

    </div>

  `;


  document.getElementById(
    "modalOverlay"
  ).style.display =
    "flex";


  // ==========================================================
  // AMBIL FILE ID
  // ==========================================================

  const fileId =
    trx.file_id ||
    toDriveDirectUrl(
      trx.url_image
    );


  let base64 =
    null;


  // ==========================================================
  // AMBIL GAMBAR
  // ==========================================================

  if (fileId) {

    if (
      imageCache[fileId]
    ) {

      base64 =
        imageCache[fileId];

    } else {

      try {

        base64 =
          await getImageBase64(
            fileId
          );


        imageCache[fileId] =
          base64;

      } catch (err) {

        console.error(
          "Gagal mengambil gambar:",
          err
        );

      }

    }

  }


  const imgHtml =
    base64

      ? `

        <img

          src="${base64}"

          id="previewImage"

          style="
            width:100%;
            border-radius:10px;
            margin-top:10px;
            cursor:pointer;
          "

        >

      `

      : `

        <div>
          Bukti tidak tersedia
        </div>

      `;


  const warnaNominal =
    String(
      trx.jenis
    )
      .toLowerCase() ===
      "masuk"

      ? "#22c55e"

      : "#ef4444";


  // ==========================================================
  // RENDER MODAL
  // ==========================================================

  document.getElementById(
    "modalContent"
  ).innerHTML = `

    <div class="modalRow">

      <div class="modalLabel">
        Tanggal
      </div>

      <div class="modalValue">
        ${formatTanggalIndonesia(
          trx.timestamp
        )}
      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Jam
      </div>

      <div class="modalValue">
        ${formatJam(trx)}
      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Kategori
      </div>

      <div class="modalValue">
        ${trx.kategori || "-"}
      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Jenis
      </div>

      <div class="modalValue">
        ${trx.jenis}
      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Nominal
      </div>

      <div
        class="modalValue"
        style="
          color:${warnaNominal};
          font-weight:600;
        "
      >

        ${formatRupiah(
          trx.nominal
        )}

      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Keterangan
      </div>

      <div class="modalValue">
        ${trx.catatan || "-"}
      </div>

    </div>


    <div class="modalRow">

      <div class="modalLabel">
        Bukti
      </div>

      <div class="modalValue">

        ${imgHtml}

      </div>

    </div>


    <div class="modalAction">

      <button
        class="btnEdit"
        onclick="
          editTransaksi(
            '${trx.id}',
            '${trx.jenis}'
          )
        "
      >
        ✏️ Edit
      </button>


      <button
        class="btnHapus"
        onclick="
          hapusTransaksiUI(
            '${trx.id}'
          )
        "
      >
        🗑️ Hapus
      </button>

    </div>

  `;


  document.body.style.overflow =
    "hidden";

}


// ============================================================
// GET IMAGE DARI APPS SCRIPT
// ============================================================

async function getImageBase64(
  fileId
) {

  const data =
    await getAPI({

      mode: "image",

      id: fileId

    });


  if (
    !data ||
    !data.base64
  ) {

    throw new Error(
      "Server tidak mengembalikan gambar"
    );

  }


  return data.base64;

}


// ============================================================
// EXTRACT DRIVE FILE ID
// ============================================================

function toDriveDirectUrl(
  input
) {

  if (!input) {
    return null;
  }


  const match =
    String(input)
      .match(
        /[-\w]{25,}/
      );


  return match
    ? match[0]
    : null;

}


// ============================================================
// EDIT TRANSAKSI
// ============================================================

function editTransaksi(id, jenis) {

  const trx = window.trxAktif;

  if (!trx || trx.id !== id) {
    showToast("Data transaksi tidak ditemukan");
    return;
  }

  sessionStorage.setItem(
    "editTransaksi",
    JSON.stringify(trx)
  );

  const tipe =
    String(jenis)
      .trim()
      .toLowerCase();

  if (tipe === "masuk") {

    location.href = "pemasukan.html";

  } else if (tipe === "keluar") {

    location.href = "pengeluaran.html";

  } else {

    showToast("Jenis transaksi tidak valid");

  }

}


// ============================================================
// PREVIEW IMAGE
// ============================================================

document.addEventListener(
  "click",
  function(e) {

    if (
      e.target.id ===
      "previewImage"
    ) {

      const overlay =
        document.getElementById(
          "imagePreviewOverlay"
        );

      const img =
        document.getElementById(
          "imagePreviewFull"
        );


      img.src =
        e.target.src;


      overlay.style.display =
        "flex";

    }


    if (
      e.target.id ===
        "imagePreviewOverlay" ||

      e.target.id ===
        "closePreviewBtn"
    ) {

      document.getElementById(
        "imagePreviewOverlay"
      ).style.display =
        "none";

    }

  }
);


// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal() {

  document.getElementById(
    "modalOverlay"
  ).style.display =
    "none";


  document.body.style.overflow =
    "";

}


document.getElementById(
  "modalOverlay"
).onclick =
  function(e) {

    if (
      e.target.id ===
      "modalOverlay"
    ) {

      closeModal();

    }

  };


// ============================================================
// LOAD MORE TANGGAL
// ============================================================

function loadMoreTanggal() {

  limitTanggal += 5;

  renderTanggal(
    dataBulanAktif
  );

}


function loadLessTanggal() {

  limitTanggal = 5;

  renderTanggal(
    dataBulanAktif
  );

}


// ============================================================
// BUTTON LOAD MORE TRANSAKSI
// ============================================================

function updateButtonLoadMore(
  data,
  tanggal
) {

  const list =
    document.getElementById(
      "transaksi-" + tanggal
    );


  const btnId =
    "btnLoadMore-" +
    tanggal;


  let btn =
    document.getElementById(
      btnId
    );


  if (!btn) {

    btn =
      document.createElement(
        "button"
      );


    btn.id =
      btnId;


    btn.onclick =
      e => {

        e.stopPropagation();


        if (
          limitTransaksiMap[tanggal] >=
          data.length
        ) {

          limitTransaksiMap[tanggal] =
            5;

        } else {

          limitTransaksiMap[tanggal] +=
            5;

        }


        renderTransaksi(
          data,
          tanggal,
          true
        );

      };


    list.appendChild(
      btn
    );

  }


  btn.innerText =
    limitTransaksiMap[tanggal] >=
    data.length

      ? "Tampilkan Sedikit"

      : "Tampilkan Lebih Banyak";


  btn.style.display =
    data.length <= 5

      ? "none"

      : "block";

}


// ============================================================
// BUTTON LOAD MORE TANGGAL
// ============================================================

function updateButtonLoadMoreTanggal() {

  const list =
    document.getElementById(
      "listTanggal"
    );


  let btn =
    document.getElementById(
      "btnLoadMoreTanggal"
    );


  if (!btn) {

    btn =
      document.createElement(
        "button"
      );


    btn.id =
      "btnLoadMoreTanggal";


    btn.onclick =
      e => {

        e.stopPropagation();


        if (
          limitTanggal >=
          totalTanggal
        ) {

          loadLessTanggal();

        } else {

          loadMoreTanggal();

        }

      };


    list.appendChild(
      btn
    );

  }


  btn.innerText =
    limitTanggal >=
    totalTanggal

      ? "Tampilkan Sedikit"

      : "Tampilkan Lebih Banyak";


  btn.style.display =
    totalTanggal <= 5

      ? "none"

      : "block";

}


// ============================================================
// RENDER KATEGORI
// ============================================================

function renderKategori(
  data
) {

  const list =
    document.getElementById(
      "listKategori"
    );


  list.innerHTML =
    "";


  const kategoriMap =
    {};


  data.forEach(
    trx => {

      const kategoriAsli =
        trx.kategori ||
        "Lainnya";


      const kategoriKey =
        kategoriAsli
          .trim()
          .toLowerCase();


      if (
        !kategoriMap[
          kategoriKey
        ]
      ) {

        kategoriMap[
          kategoriKey
        ] = {

          nama:
            kategoriAsli
              .toLowerCase()
              .split(" ")
              .map(
                kata =>
                  kata
                    .charAt(0)
                    .toUpperCase() +
                  kata.slice(1)
              )
              .join(" "),

          jenis:
            trx.jenis,

          total:
            0

        };

      }


      kategoriMap[
        kategoriKey
      ].total +=
        Number(
          trx.nominal
        ) || 0;

    }
  );


  Object.keys(
    kategoriMap
  )

    .sort(
      (a, b) =>
        kategoriMap[b].total -
        kategoriMap[a].total
    )

    .forEach(
      key => {

        const kategori =
          kategoriMap[key];


        let warna =
          "#222";

        let icon =
          "⚪";


        if (
          kategori.jenis ===
          "masuk"
        ) {

          warna =
            "#22c55e";

          icon =
            "⬆️";

        }


        if (
          kategori.jenis ===
          "keluar"
        ) {

          warna =
            "#ef4444";

          icon =
            "⬇️";

        }


        const card =
          document.createElement(
            "div"
          );


        card.className =
          "card";


        card.innerHTML = `

          <strong>

            ${icon}

            ${kategori.nama}

          </strong>


          <div
            style="
              color:${warna};
              font-weight:bold;
            "
          >

            <br>

            ${formatRupiah(
              kategori.total
            )}

          </div>

        `;


        list.appendChild(
          card
        );

      }
    );

}


// ============================================================
// SUMMARY
// ============================================================

function hitungSummaryRiwayat(
  hasil
) {

  let masuk = 0;
  let keluar = 0;


  Object.values(
    hasil.bulan || {}
  )
  .forEach(
    data => {

      data.forEach(
        trx => {

          const nominal =
            Number(
              trx.nominal
            ) || 0;


          if (
            trx.jenis ===
            "masuk"
          ) {

            masuk +=
              nominal;

          }


          if (
            trx.jenis ===
            "keluar"
          ) {

            keluar +=
              nominal;

          }

        }
      );

    }
  );


  return {

    masuk:
      masuk,

    keluar:
      keluar,

    saldo:
      masuk - keluar

  };

}


function renderSummaryRiwayat(
  hasil
) {

  const summary =
    hitungSummaryRiwayat(
      hasil
    );


  const totalMasuk =
    document.getElementById(
      "totalMasuk"
    );

  const totalKeluar =
    document.getElementById(
      "totalKeluar"
    );

  const sisaSaldo =
    document.getElementById(
      "sisaSaldo"
    );


  if (totalMasuk) {

    totalMasuk.innerText =
      formatRupiah(
        summary.masuk
      );

  }


  if (totalKeluar) {

    totalKeluar.innerText =
      formatRupiah(
        summary.keluar
      );

  }


  if (sisaSaldo) {

    sisaSaldo.innerText =
      formatRupiah(
        summary.saldo
      );

  }

}


// ============================================================
// HAPUS TRANSAKSI
// ============================================================

async function hapusTransaksiUI(
  id
) {

  const yakin =
    confirm(
      "Yakin ingin menghapus transaksi ini?"
    );


  if (!yakin) {
    return;
  }


  try {

    // ========================================================
    // HAPUS LANGSUNG DARI SUPABASE
    // ========================================================

    const {
      error
    } = await db

      .from("transactions")

      .delete()

      .eq(
        "id",
        id
      )

      .eq(
        "id_user",
        user.userId
      );


    if (error) {

      throw error;

    }


    closeModal();


    showToast(
      "Transaksi berhasil dihapus"
    );


    // Clear dashboard cache

    localStorage.removeItem(
      "dashboard_cache_" +
      user.userId
    );


    // Clear riwayat cache

    clearRiwayatCache();


    // Load ulang

    await loadRiwayat(
      true
    );


  } catch (err) {

    console.error(
      "Hapus transaksi:",
      err
    );


    showToast(
      err.message ||
      "Terjadi kesalahan"
    );

  }

}


// ============================================================
// TAB
// ============================================================

function showTab(
  tab
) {

  const rincian =
    document.getElementById(
      "tabRincian"
    );

  const kategori =
    document.getElementById(
      "tabKategori"
    );

  const menuRincian =
    document.getElementById(
      "menuRincian"
    );

  const menuKategori =
    document.getElementById(
      "menuKategori"
    );


  if (
    tab === "rincian"
  ) {

    rincian.style.display =
      "block";

    kategori.style.display =
      "none";


    menuRincian.classList.add(
      "menuAktif"
    );

    menuKategori.classList.remove(
      "menuAktif"
    );

  } else {

    rincian.style.display =
      "none";

    kategori.style.display =
      "block";


    menuKategori.classList.add(
      "menuAktif"
    );

    menuRincian.classList.remove(
      "menuAktif"
    );

  }

}


// ============================================================
// DOWNLOAD PDF
// ============================================================

async function handleDownloadPDF(
  btn
) {

  btn.disabled =
    true;


  const oldText =
    btn.innerHTML;


  updateProgressButton(
    btn,
    0,
    "Menyiapkan..."
  );


  try {

    const waktuAwal =
      document.getElementById(
        "waktuAwal"
      ).value;


    const waktuAkhir =
      document.getElementById(
        "waktuAkhir"
      ).value;


    if (
      !waktuAwal ||
      !waktuAkhir
    ) {

      alert(
        "Silakan pilih waktu awal dan waktu akhir"
      );

      return;

    }


    const start =
      parseDatetimeLocal(
        waktuAwal
      );

    const end =
      parseDatetimeLocal(
        waktuAkhir
      );


    if (
      !start ||
      !end
    ) {

      alert(
        "Format waktu tidak valid"
      );

      return;

    }


    if (
      start > end
    ) {

      alert(
        "Waktu awal tidak boleh lebih besar dari waktu akhir"
      );

      return;

    }


    await downloadLaporanPDF(
      waktuAwal,
      waktuAkhir,
      btn
    );


  } catch (err) {

    console.error(err);


    alert(
      err.message ||
      "Gagal download PDF"
    );


  } finally {

    btn.disabled =
      false;


    setTimeout(
      () => {

        btn.innerHTML =
          oldText;

      },
      1000
    );

  }

}


// ============================================================
// DATETIME LOCAL
// ============================================================

function parseDatetimeLocal(
  value
) {

  if (!value) {
    return null;
  }


  const [
    tanggal,
    waktu
  ] =
    value.split("T");


  const [
    tahun,
    bulan,
    hari
  ] =
    tanggal
      .split("-")
      .map(Number);


  const [
    jam,
    menit
  ] =
    waktu
      .split(":")
      .map(Number);


  return new Date(
    `${tahun}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}` +
    `T${String(jam).padStart(2, "0")}:${String(menit).padStart(2, "0")}:00+07:00`
  );

}


// ============================================================
// PROGRESS BUTTON
// ============================================================

function updateProgressButton(
  btn,
  persen,
  teks
) {

  if (!btn) {
    return;
  }


  const progress =
    Math.min(
      100,
      Math.max(
        0,
        persen
      )
    );


  btn.innerHTML = `

    <div
      style="
        position:relative;
        width:100%;
        height:22px;
        overflow:hidden;
        border-radius:6px;
        background:rgba(255,255,255,0.25);
      "
    >

      <div
        style="
          position:absolute;
          left:0;
          top:0;
          height:100%;
          width:${progress}%;
          background:rgba(255,255,255,0.35);
          transition:width .2s ease;
        "
      ></div>


      <div
        style="
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          font-weight:600;
          white-space:nowrap;
        "
      >

        ${teks}
        ${progress}%

      </div>

    </div>

  `;

}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setDefaultPeriodeLaporan();

    loadRiwayat();

  }
);