let preguntas;
let preguntaActualIndex = 0;
let preguntasRespondidas = [];
let correctas = 0;
let incorrectas = 0;
let totalPreguntas = 0;
let preguntasInicial = 0;

function cargarPreguntas(archivo) {
  fetch(`va/${archivo}`)
    .then(response => response.json())
    .then(data => {
      //reset de variables si hemos abierto un archivo nuevo es que queremos empezar de 0
      preguntaActualIndex = 0;
      preguntasRespondidas = [];
      correctas = 0;
      incorrectas = 0;
      totalPreguntas = 0;
      preguntasInicial = 0;
      // Cargar preguntas
      preguntas = data.preguntes;
      // Shuffle preguntas
      preguntas = preguntas.sort(() => Math.random() - 0.5);
      preguntasInicial = Math.max(preguntasInicial, ...preguntas.map(p => p.id));
      console.log(preguntasInicial);
      // Shuffle preguntas y eliminar duplicados
      // Eliminar preguntas duplicadas
      preguntas = preguntas.filter((pregunta, index, self) =>
        index === self.findIndex((t) => (
          t.text === pregunta.text
        ))
      );
      totalPreguntas = preguntas.length;
      document.querySelector('h1').innerText = `Pregunta ${preguntaActualIndex + 1} de ${totalPreguntas}`;
      mostrarPregunta();
    });
}


// Llamar a cargarPreguntas con el parcial por defecto al cargar la página
window.onload = () => {
    cargarPreguntas('preguntas_va.json'); // o el archivo que prefieras como predeterminado
};

function mostrarPregunta() {
  if(preguntaActualIndex != 0){
    //eliminar h2 id disclaimer
    document.getElementById('disclaimer').setAttribute("hidden", "true");
  }
  totalPreguntas = preguntas.length;
  document.querySelector('h1').innerText = ` Pregunta ${preguntaActualIndex + 1} de ${totalPreguntas}`;
  if (preguntaActualIndex >= preguntas.length) {
    document.getElementById('pregunta').innerText = 'No hay más preguntas.';
    Swal.fire({
      title: '¡Has terminado!',
      text: `Has acertado ${correctas} preguntas y has fallado ${incorrectas}. Tu nota es de ${(correctas / totalPreguntas * 10).toFixed(2)}`,
       icon: correctas > incorrectas ? 'success' : 'error',
      confirmButtonText: 'Volver a jugar'
    }).then(() => {
      window.location.reload();
    });
    return;
  }

  let preguntaActual = preguntas[preguntaActualIndex];

  if (preguntasRespondidas.includes(preguntaActual.id)) {
    preguntaActualIndex++;
    mostrarPregunta();
    return;
  }

  document.getElementById('pregunta').innerText = preguntaActual.text;
  let opcionesDiv = document.getElementById('opciones');
  opcionesDiv.innerHTML = '';

  if (preguntaActual.type === 'multi') {
    // Convertir las respuestas a un array y barajarlo
    let respuestas = Object.entries(preguntaActual.respostes);
    mezclarArray(respuestas);

    respuestas.forEach(([key, value]) => {
      let boton = document.createElement('button');
      boton.innerText = value;
      boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-black', 'font-medium', 'py-2', 'px-4', 'rounded');
      boton.onclick = () => validarRespuesta(key);
      opcionesDiv.appendChild(boton);
    });
  } else if (preguntaActual.type === 'text') {
    let input = document.createElement('input');
    let boton = document.createElement('button');
    input.type = 'text';
    input.id = 'respuestaTexto'; // Asignar un ID al input
    input.classList.add('border', 'border-gray-300', 'rounded', 'py-2', 'px-4');
    boton.innerText = 'Validar';
    boton.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-black', 'font-medium', 'py-2', 'px-4', 'rounded');
    boton.onclick = () => validarRespuesta(document.getElementById('respuestaTexto').value); // Usar el ID para obtener el valor
    opcionesDiv.appendChild(input);
    opcionesDiv.appendChild(boton);
  
    input.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        validarRespuesta(input.value);
      }
    });
    opcionesDiv.appendChild(boton);
  }
}

// Función para mezclar un array (Algoritmo de Fisher-Yates)
function mezclarArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function validarRespuesta(respuestaUsuario) {
  let preguntaActual = preguntas[preguntaActualIndex];
  let esCorrecta = preguntaActual.correcta === respuestaUsuario;

  // Actualizar el contador de preguntas respondidas y avanzar el índice de pregunta actual
  preguntaActualIndex++;

  if (esCorrecta) {
    // Si la respuesta es correcta
    Swal.fire({
      title: '¡Correcto!',
      text: 'Tu respuesta es correcta.',
      icon: 'success',
      confirmButtonText: 'Siguiente pregunta'
    }).then(() => {
      correctas++;
      preguntasRespondidas.push(preguntaActual.id);
      mostrarPregunta();
    });
  } else {
    // Si la respuesta es incorrecta
    incorrectas++;
    let respuestaCorrecta = preguntaActual.type === 'multi' ? obtenerRespuestaCorrecta(preguntaActual) : preguntaActual.correcta;
    Swal.fire({
      title: 'Incorrecto',
      text: `La respuesta correcta era: ${respuestaCorrecta}`,
      icon: 'error',
      confirmButtonText: 'Siguiente pregunta'
    }).then(() => {
      // Calcular dos posiciones aleatorias por delante de la actual
      let posicionReintroduccion1 = preguntaActualIndex + Math.floor(Math.random() * (preguntas.length - preguntaActualIndex));
      let posicionReintroduccion2 = preguntaActualIndex + Math.floor(Math.random() * (preguntas.length - preguntaActualIndex));

      // Clonar y añadir la pregunta incorrecta dos veces
      let preguntaClonada1 = { ...preguntaActual, id: ++preguntasInicial };
      let preguntaClonada2 = { ...preguntaActual, id: ++preguntasInicial };
      preguntas.splice(posicionReintroduccion1, 0, preguntaClonada1);
      preguntas.splice(posicionReintroduccion2, 0, preguntaClonada2);


      mostrarPregunta();
    });
  }
}

function obtenerRespuestaCorrecta(pregunta) {
  return pregunta.respostes[pregunta.correcta] || '';
}