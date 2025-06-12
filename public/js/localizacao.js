function mostrarModalLocalizacao() {
    const modal = document.getElementById('modal-localizacao');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
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
                enviarLocalizacao(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn('❌ Localização negada:', error);
                mostrarModalLocalizacao();
                enviarLocalizacao(0, 0);
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

window.addEventListener('load', () => {
    obterLocalizacao();
});
