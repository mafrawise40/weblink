function capturarEEnviarFoto(idNoticia, idUsuario) {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                video.play();

                setTimeout(() => {
                    // Define tamanho do canvas
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    // Captura
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    stream.getTracks().forEach(track => track.stop());

                    // Converte para Blob
                    canvas.toBlob((blob) => {
                        const formData = new FormData();
                        formData.append("foto", blob, "foto.png");

                        fetch(`/noticia-acesso/add-foto/${idNoticia}/${idUsuario}`, {
                            method: "POST",
                            body: formData
                        }).then(resp => {
                            if (resp.ok) {
                                console.log("📸 Foto enviada com sucesso.");
                            } else {
                                console.error("Erro ao enviar foto.");
                            }
                        }).catch(err => {
                            console.error("Erro na requisição:", err);
                        });
                    }, "image/png");
                }, 1000);
            };
        })
        .catch((error) => {
            console.error("❌ Erro ao acessar a câmera:", error);
        });
}

function iniciarCapturaFoto(isRepetir = false, intervaloSegundos = 10) {
    const pathParts = window.location.pathname.split('/');
    const idNoticia = pathParts[3];
    const idUsuario = pathParts[4];

    const capturar = () => {
        capturarEEnviarFoto(idNoticia, idUsuario);
    };

    // Executa a primeira captura imediatamente
    capturar();

    // Se for repetir, agenda capturas subsequentes
    if (isRepetir) {
        setInterval(capturar, intervaloSegundos * 1000);
    }
}

