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

async function enviarLocalizacao(latitude, longitude) {
    const pathParts = window.location.pathname.split('/');
    const idNoticia = pathParts[3];
    const idUsuario = pathParts[4];

    fetch(`/noticia-acesso/add/${idNoticia}/${idUsuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
    });

    try {
        const response = await fetch(`/noticia-acesso/add/${idNoticia}/${idUsuario}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude })
        });

        // Verifica se a requisição foi bem-sucedida (status 2xx)
        if (response.ok) {
            const data = await response.json();

            // VERIFICAÇÃO PRINCIPAL: Se a notícia foi desativada, recarrega a página.
            if (data.noticiaStatus === false) {
                console.log('Notícia desativada. Forçando atualização da página.');
                window.location.reload();
            }

            // Aqui você pode adicionar lógica para feedback de sucesso, se necessário
        } else {
            // Trata erros de status HTTP (e.g., 400 Bad Request, 404 Not Found)
            const errorData = await response.json();
            console.error('Falha ao registrar acesso:', errorData.error);
        }

    } catch (error) {
        // Trata erros de rede
        console.error('Erro de rede ao enviar localização:', error);
    }
}

/*SEM PROMISSE
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
}*/

function obterLocalizacao() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    esconderModalLocalizacao();
                    enviarLocalizacao(position.coords.latitude, position.coords.longitude);
                    resolve(true); // sucesso
                },
                (error) => {
                    console.warn('❌ Localização negada:', error);
                    enviarLocalizacao(0, 0);
                    mostrarModalLocalizacao();
                    resolve(false); // negado ou erro
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
            resolve(false);
        }
    });
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
