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
    mostrarModalLocalizacao(); // mostra o modal imediatamente

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                esconderModalLocalizacao(); // remove o modal quando aceito
                enviarLocalizacao(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn('❌ Localização negada:', error);
                // Modal já está visível, então não precisa mostrar de novo
                enviarLocalizacao(0, 0);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        enviarLocalizacao(0, 0);
    }
}

window.addEventListener('load', () => {
    obterLocalizacao();
});
