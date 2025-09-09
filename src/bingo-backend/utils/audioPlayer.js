// Simple audio path resolver for Amharic phrases
export function getAudioPath(eventType) {
  switch (eventType) {
    case 'bingo-win':
      return '/audio/bingo_win.mp3'; // ቢንጎ አሸንፈህ!
    case 'row-filled':
      return '/audio/row_filled.mp3'; // አንድ ሰንደቅ ተሞልቷል!
    case 'congrats':
      return '/audio/congrats.mp3'; // ደስ ይበላ!
    default:
      return null;
  }
}
