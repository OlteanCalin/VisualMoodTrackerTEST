﻿
export default class WebcamCapture extends React.Component {

    constructor(props) {
        super(props);
        this.interval = setInterval(this.takePicture, 20000);
        this.state = {
            videoOn: false,
            buttonState: "Pause",
            sessionId: null,
        }
    };

    componentDidMount() {
        if (this.props.autoStartWebcam == true && this.props.sessionId != null && this.state.videoOn == false) {
            this.startWebcam();
        }
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    startWebcam = () => {
        var video = document.querySelector('video');
        navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 4096 },
                height: { ideal: 2160 }
            }
        })
            .then(function (stream) {
                video.srcObject = stream;
                window.localstream = stream;
            })
            .catch(function (error) {
                console.log('error', error);
            });
        this.setState({
            videoOn: true,
            buttonState: "Pause",
            video: document.querySelector('video')
        });
        this.interval;
    }

    takePicture = () => {
        if (this.state.videoOn) {
            var url = "/api/sessions/webcam";
            var canvas = document.querySelector('canvas');
            var context = canvas.getContext('2d');
            var video = document.querySelector('video');

            canvas.width = (video.videoWidth / 2);
            canvas.height = (video.videoHeight / 2);
            context.drawImage(video, 0, 0, (video.videoWidth / 2), (video.videoHeight / 2));
            var base64Img = canvas.toDataURL('image.png');

            if (this.props.sessionId != null) {
                const formData = new FormData();
                formData.append('base64Img', base64Img);
                formData.append('sessionId', this.props.sessionId);
                const config = {
                    headers: {
                        'content-type': 'multipart/form-data'
                    }
                }
                axios.post(url, formData, config).then(response => {
                    this.props.updateState(response.data)
                });
            }
            else {
                const formData = new FormData();
                formData.append('base64Img', base64Img);
                formData.append('sessionId', this.state.sessionId);
                const config = {
                    headers: {
                        'content-type': 'multipart/form-data'
                    }
                }
                axios.post(url, formData, config)
                    .then(response => {

                        this.setState({
                            sessionId: response.data.name,
                            videoOn: false,
                        })  
                        video.srcObject.getVideoTracks().forEach(track => track.stop());
                        video.srcObject.getTracks().forEach(track => track.stop());
                        video.srcObject = null;

                        this.props.updateState(response.data, true)
                    });
            }
        }
    }

    stopWebcam = () => {
        var video = document.querySelector('video');
        this.setState({
            videoOn: false
        })
        video.srcObject.getVideoTracks().forEach(track => track.stop());
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    };

    pauseWebcam = () => {
        if (this.state.videoOn) {
            if (this.state.buttonState == "Play") {
                this.setState({
                    buttonState: "Pause"
                })
                this.state.video.play();
            }
            else {
                this.setState({
                    buttonState: "Play"
                })
                this.state.video.pause();
            }
        }
    }

    render() {
        //Calling takePicture every 20 seconds
        //this.interval;
        return (
            <div>
                <button className="btn btn-lg black-background white" onClick={this.startWebcam}>Start Webcam</button>
                <button className="btn btn-lg black-background white" onClick={this.pauseWebcam}>{this.state.buttonState}</button>
                <button className="btn btn-lg black-background white" onClick={this.stopWebcam}>Stop Webcam</button>
                <div>
                    <video width="400" height="400" id='video' autoPlay="true" controls="true" />
                </div>
                <canvas hidden="true"></canvas>
            </div>
        );
    };
};