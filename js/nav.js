function lihatDompet(){
  window.location.href = "dompet.html";
}

function lihatRiwayatTransaksi(){
  window.location.href = "riwayat-transaksi.html";
}

function lihatDashboard(){
  window.location.href = "dashboard.html";
}

function lihatProfil(){
  window.location.href = "user-profil.html";
}


function setBottomNavActive(){

    const page =
        location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    const menuMap = {
        "dashboard": "dashboard",
        "riwayat-transaksi": "laporan",
        "user-profil": "user-profil",
        "dompet": "dompet"
    };

    const menu = menuMap[page];

    document.querySelectorAll(".bottomNav button")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.menu === menu
            );

        });
}


setBottomNavActive();