import React, { useEffect, useRef } from 'react';

const TRACK_LENGTH = 70;

export function HorseRaceThreeScene({ ranking = [], phase = 'race_pack' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};
    let stopped = false;

    const init = async () => {
      const THREE = await import('https://unpkg.com/three@0.179.1/build/three.module.js');
      if (stopped || !hostRef.current) return;

      const host = hostRef.current;
      const width = host.clientWidth || 920;
      const height = host.clientHeight || 420;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#baeef4');

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 27, 62);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      host.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 0.65);
      dir.position.set(10, 20, 12);
      scene.add(dir);

      const trackGeo = new THREE.PlaneGeometry(88, 38);
      const trackMat = new THREE.MeshStandardMaterial({ color: '#b59658' });
      const track = new THREE.Mesh(trackGeo, trackMat);
      track.rotation.x = -Math.PI / 2;
      track.position.y = -2;
      scene.add(track);

      const finishGeo = new THREE.PlaneGeometry(1.5, 38);
      const finishMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5' });
      const finish = new THREE.Mesh(finishGeo, finishMat);
      finish.rotation.x = -Math.PI / 2;
      finish.position.set(-24, -1.9, 0);
      scene.add(finish);

      const laneCount = Math.min(12, ranking.length || 12);
      const horses = [];
      const order = ranking.length ? ranking : Array.from({ length: 12 }, (_, i) => i + 1);

      for (let i = 0; i < laneCount; i += 1) {
        const horseGeo = new THREE.BoxGeometry(2.6, 1.3, 1.1);
        const horseMat = new THREE.MeshStandardMaterial({
          color: i === 0 ? '#29f04f' : i % 2 === 0 ? '#f36220' : '#202020'
        });
        const horse = new THREE.Mesh(horseGeo, horseMat);
        const laneZ = -16 + i * (32 / (laneCount - 1 || 1));
        horse.position.set(34, -1.2, laneZ);
        scene.add(horse);

        const markerGeo = new THREE.SphereGeometry(0.58, 16, 16);
        const markerMat = new THREE.MeshStandardMaterial({ color: '#fff2d9' });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(35.8, -0.7, laneZ);
        scene.add(marker);

        horses.push({
          horse,
          marker,
          laneZ,
          rank: order.indexOf(order[i]) + 1
        });
      }

      let frame = 0;
      const animate = () => {
        if (stopped) return;
        frame += 1;
        const t = frame / 90;

        horses.forEach((entry) => {
          const base = phase === 'finish_zoom'
            ? -24 + (entry.rank - 1) * 1.8
            : -5 + (entry.rank - 1) * 2.2;
          const motion = phase === 'finish_zoom' ? 0 : Math.sin(t * 2 + entry.rank) * 0.8;
          const x = Math.max(-26, Math.min(34, base + motion + TRACK_LENGTH * 0.02));
          entry.horse.position.x += (x - entry.horse.position.x) * 0.06;
          entry.horse.rotation.z = Math.sin(t * 7 + entry.rank) * 0.02;
          entry.marker.position.x = entry.horse.position.x + 1.8;
        });

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        if (!hostRef.current) return;
        const w = hostRef.current.clientWidth || width;
        const h = hostRef.current.clientHeight || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        trackGeo.dispose();
        trackMat.dispose();
        finishGeo.dispose();
        finishMat.dispose();
        horses.forEach(({ horse, marker }) => {
          horse.geometry.dispose();
          horse.material.dispose();
          marker.geometry.dispose();
          marker.material.dispose();
        });
        host.innerHTML = '';
      };
    };

    init().catch(() => {
      if (hostRef.current) {
        hostRef.current.innerHTML = '<div class="three-fallback">3D view unavailable</div>';
      }
    });

    return () => {
      stopped = true;
      cleanup();
    };
  }, [ranking, phase]);

  return <div ref={hostRef} className="horse-three-scene" aria-label="Horse race 3D scene" />;
}
