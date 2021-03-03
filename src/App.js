import React, { Component } from 'react';
//
import io from 'socket.io-client'

class App extends Component {
  constructor(props) {
    super(props)

    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()

    this.socket = null
    this.candidates = []


  }

  componentDidMount() {

    this.socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }
    )

    this.socket.on('connection-success', success => {
      console.log(success)
    })

    this.socket.on('offerOrAnswer', (sdp) => {
      this.textref.value = JSON.stringify(sdp)

      // set sdp as remote description
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    this.socket.on('candidate', (candidate) => {
      // console.log('From Peer... ', JSON.stringify(candidate))
      //this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    //const pc_config = null

    const pc_config = {
      "iceServers": [
        // {
        //   urls: 'stun:[STUN_IP]:[PORT]',
        //   'credentials': '[YOR CREDENTIALS]',
        //   'username': '[USERNAME]'
        // },
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    }



    this.pc = new RTCPeerConnection(pc_config)

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        //console.log(JSON.stringify(e.candidate))
        this.sendToPeer('candidate', e.candidate)

      }
    }

    this.pc.onaddstream = (e) => {
      this.remoteVideoref.current.srcObject = e.stream
    }


    const constraints = { video: true }

    const success = (stream) => {
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    }

    const failure = (e) => {
      console.log('getUserMedia Error:', e)
    }

    navigator.mediaDevices.getUserMedia(constraints)
      .then(success)
      .catch(failure)

  }


  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }

  createOffer = () => {
    console.log('Offer')
    this.pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        //console.log(JSON.stringify(sdp))
        // set offer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)
      })
  }

  setRemoteDescription = () => {
    // retrieve and parse the SDP copied from the remote peer
    const desc = JSON.parse(this.textref.value)
    // set sdp as remote description
    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  }

  createAnswer = () => {
    console.log('Answer')
    this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        //console.log(JSON.stringify(sdp))
        // set answer sdp as local description
        this.pc.setLocalDescription(sdp)

        this.sendToPeer('offerOrAnswer', sdp)

      })
  }

  addCandidate = () => {
    // retrieve and parse the Candidate copied from the remote peer
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)

    // add the candidate to the peer connection
    //this.pc.addIceCandidate(new RTCIceCandidate(candidate))

    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate))
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    });
  }

  render() {

    return (
      <div>
        <video
          style={{
            zIndex: 2,
            position: 'fixed',
            right: 0,
            bottom: 0,
            width: 200, height: 200,
            margin: 10, backgroundColor: 'black'

          }}
          ref={this.localVideoref}
          autoPlay></video>

        <video
          style={{
            zIndex: 1,
            minWidth: '1000px',
            minHeight: '1000px',
            bottom: 0,
            position: 'fixed',
            //width: 400, height: 400,
            backgroundColor: 'black'
          }}
          ref={this.remoteVideoref}
          autoPlay></video>

        <br />
        <div style={{ zIndex: 1, position: 'fixed' }}>
          <button onClick={this.createOffer}>Offer</button>
          <button onClick={this.createAnswer}>Answer</button>
          <br />
          <textarea ref={ref => { this.textref = ref }}></textarea>
          <br />
        </div>
        {/* <button onClick={this.setRemoteDescription}>Set Remote Description</button>
        <button onClick={this.addCandidate}>Add Candidate</button> */}
        <br />





      </div >
    );
  }
}


export default App;
