// ========================================
// PIUSBEATS WEBSITE JAVASCRIPT
// ========================================

// MOBILE NAVIGATION
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const toast = document.getElementById('toast');

let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

menuToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '✕' : '☰';
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (menuToggle) menuToggle.textContent = '☰';
  });
});

// BEAT GENRE FILTERING
document.querySelectorAll('.filter').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.filter.active')?.classList.remove('active');
    button.classList.add('active');
    const filter = button.dataset.filter;
    document.querySelectorAll('.beat-card').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.genre !== filter;
    });
  });
});

// ========================================
// PERSISTENT MUSIC PLAYER
// ========================================
const audio = document.getElementById('audioPlayer');
const musicPlayer = document.getElementById('musicPlayer');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerArt = document.getElementById('playerArt');
const playerPlay = document.getElementById('playerPlay');
const previousTrack = document.getElementById('previousTrack');
const nextTrack = document.getElementById('nextTrack');
const closePlayer = document.getElementById('closePlayer');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const totalDurationDisplay = document.getElementById('totalDuration');
const volumeControl = document.getElementById('volumeControl');

const beatCards = Array.from(document.querySelectorAll('.beat-card'));
const tracks = beatCards.map((card, index) => ({
  title: card.querySelector('.beat-info h3')?.textContent.trim() || 'Untitled beat',
  audio: card.querySelector('.play-button')?.dataset.audio || '',
  button: card.querySelector('.play-button'),
  status: card.querySelector('.audio-status'),
  artwork: `PB / 00${index + 1}`
}));

let currentTrackIndex = -1;
const unavailableTracks = new Set();

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateTrackButtons() {
  tracks.forEach((track, index) => {
    const isCurrentTrack = index === currentTrackIndex;
    const isPlaying = isCurrentTrack && !audio.paused && !audio.error;

    if (track.button) {
      track.button.textContent = isPlaying ? 'Ⅱ' : '▶';
      track.button.setAttribute(
        'aria-label',
        isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
      );
    }

    if (track.status) {
      if (unavailableTracks.has(index)) {
        track.status.textContent = 'Preview unavailable';
      } else if (isPlaying) {
        track.status.textContent = 'Now playing';
      } else if (isCurrentTrack && audio.currentSrc) {
        track.status.textContent = 'Preview paused';
      } else {
        track.status.textContent = 'Preview coming soon';
      }
    }
  });

  if (playerPlay) {
    const playing = currentTrackIndex !== -1 && !audio.paused && !audio.error;
    playerPlay.textContent = playing ? 'Ⅱ' : '▶';
    playerPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }
}

function playTrack(index) {
  const track = tracks[index];

  if (!track || !track.audio) {
    showToast('This beat does not have an audio file configured yet.');
    return;
  }

  musicPlayer.hidden = false;
  document.body.classList.add('player-open');

  if (index === currentTrackIndex && !audio.paused && !audio.error) {
    audio.pause();
    return;
  }

  if (
    index === currentTrackIndex &&
    audio.currentSrc &&
    audio.paused &&
    !unavailableTracks.has(index)
  ) {
    audio.play().catch(() =>
      showToast('Could not resume this preview. Check the MP3 file.')
    );
    return;
  }

  currentTrackIndex = index;
  unavailableTracks.delete(index);

  playerTitle.textContent = track.title;
  playerArtist.textContent = 'PiusBeats · Music Production';
  playerArt.textContent = track.artwork;

  progressBar.value = 0;
  progressBar.max = 100;
  currentTimeDisplay.textContent = '0:00';
  totalDurationDisplay.textContent = '0:00';

  audio.src = track.audio;
  audio.load();

  updateTrackButtons();

  audio.play().catch(() => {
    if (currentTrackIndex === index) {
      showToast(`Could not play ${track.title}. Check that its MP3 file exists.`);
    }
  });
}

tracks.forEach((track, index) => {
  track.button?.addEventListener('click', () => playTrack(index));
});

playerPlay?.addEventListener('click', () => {
  if (currentTrackIndex === -1) {
    showToast('Choose a beat from the catalogue first.');
    return;
  }

  if (audio.paused) {
    audio.play().catch(() =>
      showToast('Could not play this preview. Check the MP3 file.')
    );
  } else {
    audio.pause();
  }
});

previousTrack?.addEventListener('click', () => {
  if (!tracks.length) return;
  playTrack(currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1);
});

nextTrack?.addEventListener('click', () => {
  if (!tracks.length) return;
  playTrack(currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1);
});

audio?.addEventListener('play', updateTrackButtons);
audio?.addEventListener('pause', updateTrackButtons);

audio?.addEventListener('loadedmetadata', () => {
  if (Number.isFinite(audio.duration)) {
    totalDurationDisplay.textContent = formatTime(audio.duration);
    progressBar.max = audio.duration;

    if (currentTrackIndex !== -1) {
      unavailableTracks.delete(currentTrackIndex);
    }

    updateTrackButtons();
  }
});

audio?.addEventListener('timeupdate', () => {
  currentTimeDisplay.textContent = formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    progressBar.value = audio.currentTime;
  }
});

progressBar?.addEventListener('input', () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = Number(progressBar.value);
  }
});

if (audio && volumeControl) {
  audio.volume = Number(volumeControl.value);

  volumeControl.addEventListener('input', () => {
    audio.volume = Number(volumeControl.value);
  });
}

audio?.addEventListener('ended', () => {
  progressBar.value = 0;
  currentTimeDisplay.textContent = '0:00';
  updateTrackButtons();
});

audio?.addEventListener('error', () => {
  if (currentTrackIndex === -1) return;

  const failedIndex = currentTrackIndex;
  const track = tracks[failedIndex];

  unavailableTracks.add(failedIndex);

  if (track?.status) {
    track.status.textContent = 'Preview unavailable';
  }

  if (playerPlay) {
    playerPlay.textContent = '▶';
    playerPlay.setAttribute('aria-label', 'Play');
  }

  showToast(
    `The ${track?.title || 'beat'} preview could not be loaded. Check its MP3 file.`
  );

  updateTrackButtons();
});

closePlayer?.addEventListener('click', () => {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();

  currentTrackIndex = -1;
  musicPlayer.hidden = true;

  document.body.classList.remove('player-open');

  progressBar.value = 0;
  currentTimeDisplay.textContent = '0:00';
  totalDurationDisplay.textContent = '0:00';

  playerTitle.textContent = 'Select a beat';
  playerArtist.textContent = 'PiusBeats';
  playerArt.textContent = 'PB';

  updateTrackButtons();
});

// ========================================
// BOOKING PRICE CALCULATOR
// ========================================
const bookingForm = document.getElementById('contactForm');
const bookingService = document.getElementById('bookingService');
const bookingQuantity = document.getElementById('bookingQuantity');
const quantityRow = document.getElementById('quantityRow');
const quantityLabel = document.querySelector('.quantity-label');
const quantityHelp = document.getElementById('quantityHelp');
const bookingDate = document.getElementById('bookingDate');

const estimatedTotal = document.getElementById('estimatedTotal');
const estimatedDeposit = document.getElementById('estimatedDeposit');
const estimatedBalance = document.getElementById('estimatedBalance');
const estimateNote = document.getElementById('estimateNote');

const formEstimatedTotal = document.getElementById('formEstimatedTotal');
const formDepositAmount = document.getElementById('formDepositAmount');
const formRemainingBalance = document.getElementById('formRemainingBalance');

const servicePricing = {
  'Recording Session': {
    price: 250,
    unit: 'hour',
    label: 'Number of hours *',
    help: 'Recording is charged at K250 per hour.'
  },

  'Mixing and mastering': {
    price: 300,
    unit: 'track',
    label: 'Number of tracks *',
    help: 'Mixing and mastering is charged at K300 per track.'
  },

  'Beat licensing': {
    price: 300,
    unit: 'beat',
    label: 'Number of beats *',
    help: 'Non-exclusive beat leases are charged at K300 per beat.'
  },

  'Full Project package': {
    price: 750,
    unit: 'project',
    label: 'Full Project quantity',
    help: 'The Full Project package is priced at K750 per project.'
  }
};

function money(value) {
  return `K${Number(value).toLocaleString('en-ZM', {
    maximumFractionDigits: 2
  })}`;
}

function updateBookingEstimate() {
  if (!bookingService) return;

  const service = bookingService.value;
  const pricing = servicePricing[service];

  const quantity = Math.max(
    1,
    Math.min(100, Number.parseInt(bookingQuantity?.value, 10) || 1)
  );

  if (!pricing) {
    if (quantityRow) {
      quantityRow.classList.add('is-hidden');
    }

    if (bookingQuantity) {
      bookingQuantity.required = false;
    }

    estimatedTotal.textContent = 'To be confirmed';
    estimatedDeposit.textContent = 'To be confirmed';
    estimatedBalance.textContent = 'To be confirmed';

    estimateNote.textContent =
      'For general enquiries, PiusBeats will discuss the service and price with you.';

    formEstimatedTotal.value = 'To be confirmed';
    formDepositAmount.value = 'To be confirmed';
    formRemainingBalance.value = 'To be confirmed';

    return;
  }

  if (quantityRow) {
    quantityRow.classList.remove('is-hidden');
  }

  if (bookingQuantity) {
    bookingQuantity.required = service !== 'Full Project package';
    bookingQuantity.value =
      service === 'Full Project package' ? '1' : String(quantity);

    bookingQuantity.readOnly = service === 'Full Project package';
  }

  if (quantityLabel) {
    quantityLabel.textContent = pricing.label;
  }

  if (quantityHelp) {
    quantityHelp.textContent = pricing.help;
  }

  const effectiveQuantity =
    service === 'Full Project package' ? 1 : quantity;

  const total = pricing.price * effectiveQuantity;
  const deposit = total * 0.5;
  const balance = total - deposit;

  estimatedTotal.textContent = money(total);
  estimatedDeposit.textContent = money(deposit);
  estimatedBalance.textContent = money(balance);

  estimateNote.textContent =
    service === 'Full Project package'
      ? 'The Full Project package includes 1 non-exclusive beat, a recording session and full mixing & mastering.'
      : `Estimate based on ${effectiveQuantity} ${pricing.unit}${effectiveQuantity === 1 ? '' : 's'}. Final amount is confirmed by PiusBeats.`;

  formEstimatedTotal.value = money(total);
  formDepositAmount.value = money(deposit);
  formRemainingBalance.value = money(balance);
}

bookingService?.addEventListener('change', updateBookingEstimate);
bookingQuantity?.addEventListener('input', updateBookingEstimate);

// Prevent choosing a date in the past.
if (bookingDate) {
  const today = new Date();

  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  bookingDate.min = localToday;
}

updateBookingEstimate();

// ========================================
// PREPARE SERVICE / BEAT ENQUIRIES
// ========================================
function prepareBooking(serviceName, message) {
  if (bookingService) {
    bookingService.value = serviceName;
    updateBookingEstimate();
  }

  const messageField = document.querySelector(
    '#contactForm textarea[name="message"]'
  );

  if (messageField) {
    messageField.value = message;
  }

  document.getElementById('contact')?.scrollIntoView({
    behavior: 'smooth'
  });
}

document.querySelectorAll('.license-button').forEach(button => {
  button.addEventListener('click', () => {
    const beatName = button.dataset.beat;

    prepareBooking(
      'Beat licensing',
      `Hello, I am interested in licensing the "${beatName}" beat.\n\nPlease share the available licensing options and prices.`
    );

    showToast(
      `Enquiry prepared for ${beatName}. Complete your booking details below.`
    );
  });
});

document.querySelectorAll('[data-service]').forEach(button => {
  button.addEventListener('click', () => {
    const selectedService = button.dataset.service;

    prepareBooking(
      selectedService,
      `Hello, I am interested in the ${selectedService} service. Please share more information and available booking dates.`
    );

    showToast(
      `${selectedService} selected. Complete your booking details below.`
    );
  });
});

// FORMSPREE
// Formspree's existing AJAX integration in index.html handles form submission.
// Do not add a second submit listener here.

// AUTOMATIC COPYRIGHT YEAR
const yearElement = document.getElementById('year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}