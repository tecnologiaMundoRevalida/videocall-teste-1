"use client"

import { useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';

export default function Home() {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('https://web-socket-mundorevalida.com:3000',{autoConnect: false,secure:false});

    socketRef.current.auth = {user_id: '123452'}
    socketRef.current.connect();

    socketRef.current.emit('joinRoom', {training: '20', id: '1234528'});
    // Access user's camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // localVideoRef.current.srcObject = stream;
        
        // Emit 'offer' event
        const peerConnection = new RTCPeerConnection(
          {
            iceServers: [
              // {
              //   urls: "stun:stun.l.google.com:19302"
              // },
              {
                urls: "turn:44.196.233.187:3478",
                username: "mundorevalida",
                credential: "mundorevalida2023"
              }
            ]
          }
        );
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.createOffer()
          .then((offer) => peerConnection.setLocalDescription(offer))
          .then(() => {
            socketRef.current.emit('offer', {offer:peerConnection.localDescription,room:'20'});
          });

        // Listen for 'answer' event
        socketRef.current.on('answerReceived', (answer) => {
          console.log(answer);
          peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // Listen for 'ice-candidate' event
        // socketRef.current.on('ice-candidate', (candidate) => {
        //   peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        // });

        // Create answer and emit 'answer' event
        peerConnection.onicecandidate = (event) => {
          console.log(event);
          if (event.candidate) {
            socketRef.current.emit('iceCandidate', {candidate:event.candidate,room:'20'});
          }
        };

        peerConnection.ontrack = (event) => {
          console.log(event.streams);
          remoteVideoRef.current.srcObject = event.streams[0];
        };
      })
      .catch((error) => console.error('Error accessing camera:', error));
  }, []);

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <video ref={localVideoRef} autoPlay muted />
      <video ref={remoteVideoRef} autoPlay />
    </div>
  );
}