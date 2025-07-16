function mostrarModalLocalizacao() {
    const modal = document.getElementById('modal-localizacao');
    const overlay = document.getElementById('overlay-ofuscar');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    if (overlay) {
        overlay.style.display = 'block';
    }
}

function esconderModalLocalizacao() {
    const modal = document.getElementById('modal-localizacao');
    const overlay = document.getElementById('overlay-ofuscar');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function enviarLocalizacao(latitude, longitude) {
    const pathParts = window.location.pathname.split('/');
    const idNoticia = pathParts[3];
    const idUsuario = pathParts[4];

    fetch(`/noticia-acesso/add/${idNoticia}/${idUsuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
    });
}

function obterLocalizacao() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                esconderModalLocalizacao(); // remove o modal quando aceito
                enviarLocalizacao(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn('❌ Localização negada:', error);
                enviarLocalizacao(0, 0);
                mostrarModalLocalizacao();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        mostrarModalLocalizacao();
        enviarLocalizacao(0, 0);
    }
}


function iniciarLocalizacaoPeriodica() {
    document.body.style.visibility = 'visible';
    obterLocalizacao();

    setInterval(() => {
        obterLocalizacao();
    }, 5000);
}
/*
window.addEventListener('load', () => {
    document.body.style.visibility = 'visible';
    obterLocalizacao();

    // 🔁 Chamar novamente a cada 5 segundos
    setInterval(() => {
        obterLocalizacao();
    }, 5000); // 5000 ms = 5 segundos
});*/
