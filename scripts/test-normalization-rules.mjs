import { normalizeKoreanInput } from '../src/normalizeKoreanInput.js';

const samples = [
  '안뇽ㅋㅋ',
  '뭐하고있어?',
  '어디잇어??',
  '해줄수있어',
  '보여주세여',
  '제가 조금 있다 점심 때는 약속이 잇어서요',
];

for (const sample of samples) {
  console.log('\n===', sample, '===');
  console.log(normalizeKoreanInput(sample));
}
