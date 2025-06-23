function createCylinderLine(idA, idB) {
    const cyl = document.createElement('a-cylinder');
    cyl.setAttribute('radius', 15); // толщина
    cyl.setAttribute('color', 'red');
    cyl.setAttribute('visible', false);
    document.querySelector('a-scene').appendChild(cyl);
    console.log(`🔧 Цилиндр-линия ${idA}-${idB} создана`);
    return cyl;
}

function createSphereAt(label) {
    const sphere = document.createElement('a-sphere');
    sphere.setAttribute('radius', 10);
    sphere.setAttribute('color', 'red');
    sphere.setAttribute('visible', false);
    document.querySelector('a-scene').appendChild(sphere);
    console.log(`⚪ Сфера для ${label} создана`);
    return sphere;
}

function updateCylinderLine(cylinder, posA, posB, label) {
    const dist = posA.distanceTo(posB);
    const mid = {
        x: (posA.x + posB.x) / 2,
        y: (posA.y + posB.y) / 2,
        z: (posA.z + posB.z) / 2
    };

    cylinder.setAttribute('height', dist);
    cylinder.setAttribute('position', `${mid.x} ${mid.y} ${mid.z}`);

    const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
    cylinder.object3D.setRotationFromQuaternion(quaternion);
}

function triangleArea(p1, p2, p3) {
    const a = p1.distanceTo(p2);
    const b = p2.distanceTo(p3);
    const c = p3.distanceTo(p1);
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

AFRAME.registerComponent('quad-analysis', {
    init: function () {
        this.markers = {
            a: document.querySelector('#marker-a'),
            b: document.querySelector('#marker-b'),
            c: document.querySelector('#marker-c'),
            d: document.querySelector('#marker-d')
        };
        this.visible = { a: false, b: false, c: false, d: false };

        for (const id in this.markers) {
            const marker = this.markers[id];
            marker.addEventListener("targetFound", () => this.visible[id] = true);
            marker.addEventListener("targetLost", () => this.visible[id] = false);
        }

        this.lines = {
            ab: createCylinderLine('A', 'B'),
            bd: createCylinderLine('B', 'D'),
            dc: createCylinderLine('D', 'C'),
            ca: createCylinderLine('C', 'A')
        };

        this.spheres = {
            ab: createSphereAt('ab'),
            bd: createSphereAt('bd'),
            dc: createSphereAt('dc'),
            ca: createSphereAt('ca')
        };

        this.textEntity = document.createElement('a-text');
        this.textEntity.setAttribute('color', 'black');
        this.textEntity.setAttribute('align', 'center');
        this.textEntity.setAttribute('visible', false);
        this.textEntity.setAttribute('width', 1000);
        this.textEntity.setAttribute('value', '');

        document.querySelector('a-scene').appendChild(this.textEntity);
    },

    tick: function () {
        const v = this.visible;
        if (v.a && v.b && v.c && v.d) {
            const A = this.markers.a.object3D.getWorldPosition(new THREE.Vector3());
            const B = this.markers.b.object3D.getWorldPosition(new THREE.Vector3());
            const C = this.markers.c.object3D.getWorldPosition(new THREE.Vector3());
            const D = this.markers.d.object3D.getWorldPosition(new THREE.Vector3());

            const updateIfVisible = (id1, id2, key) => {
                const posA = this.markers[id1].object3D.getWorldPosition(new THREE.Vector3());
                const posB = this.markers[id2].object3D.getWorldPosition(new THREE.Vector3());
                this.lines[key].setAttribute('visible', true);
                this.spheres[key].setAttribute('visible', true);
                updateCylinderLine(this.lines[key], posA, posB, key.toUpperCase());
                this.spheres[key].setAttribute('position', `${posA.x} ${posA.y} ${posA.z}`);
            };

            updateIfVisible('a', 'b', 'ab');
            updateIfVisible('b', 'd', 'bd');
            updateIfVisible('d', 'c', 'dc');
            updateIfVisible('c', 'a', 'ca');

            const perimeter = A.distanceTo(B) + B.distanceTo(D) + D.distanceTo(C) + C.distanceTo(A);
            const areaABC = triangleArea(A, B, C);
            const areaABD = triangleArea(A, B, D);
            const areaACD = triangleArea(A, C, D);
            const areaBCD = triangleArea(B, C, D);

            // Вычислить точку над серединой AB
            const midAB = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);



            // Установить глобальную позицию текста через object3D
            this.textEntity.object3D.position.set(midAB.x, midAB.y + 200, midAB.z - 100);
            this.textEntity.object3D.lookAt(this.el.sceneEl.camera.el.object3D.position);

            // Обновить текст
            this.textEntity.setAttribute('value',
                `P: ${perimeter.toFixed(2)} м\n` +
                `S(ABC): ${areaABC.toFixed(2)}\n` +
                `S(ABD): ${areaABD.toFixed(2)}\n` +
                `S(ACD): ${areaACD.toFixed(2)}\n` +
                `S(BCD): ${areaBCD.toFixed(2)}`
            );
            this.textEntity.setAttribute('visible', true);
        } else {
            for (let key in this.lines) this.lines[key].setAttribute('visible', false);
            for (let key in this.spheres) this.spheres[key].setAttribute('visible', false);
            this.textEntity.setAttribute('visible', false);
        }
    }

});

window.addEventListener("load", () => {
    document.querySelector("a-scene").setAttribute("quad-analysis", "");
});
