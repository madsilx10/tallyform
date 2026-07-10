const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const ENDPOINT = 'https://api.tally.so/forms/mOv9qM/respond';

const FIELD_IDS = {
  sui:      '0a5ada9e-815e-4ddf-b821-714f22905294',
  evm:      '6f7af265-6620-4fce-adec-cd8ba97940cb',
  email:    '14c1445e-ca6c-4a16-8805-b2f602d95960',
  username: 'b556cb41-7510-4704-9008-fd23a062ca3f',
  checkAll: '73fd4a36-df20-4b23-9112-f7bbf6fc8f2f',
  check2:   'e4bf420a-3932-4502-b578-6063cd418286',
  number:   '43b2c77e-70bb-4fe1-b22a-8c7cc87efc40',
};

const CHECK_ALL_OPTIONS = [
  '6a70ec54-5bf0-4927-8ec7-e4add48d8b1e',
  '1cf78a11-c3e9-4240-8143-9dbede436bc3',
  '5dc6fa8a-20d9-4097-a8ab-dbf8a39816e6',
  '6bf52db6-05da-4eba-b328-c67de9de67c6',
  '5e557ab8-f8f3-4c8e-87ce-44c22f30d78f',
  '2651b3e2-1813-4435-a795-dabff38c4cd0',
  '3f81343c-6d53-4f24-b9b3-cb3c125d6e10',
  '2b21978a-7282-45c6-b1d3-af0089968be1',
  '9854ddb6-fbcb-4044-8268-e403365062c2',
  '20a18d6a-d489-4f0c-8bf8-8b35e1899d65',
  '1c9c0aeb-e8be-4221-b507-3e62aac824e4',
  '379e8e60-17c9-4b9c-afc9-c48ccbb1d596',
  '91048379-92aa-47ee-ad72-df9dbc28d548',
  'b3ac66de-68a0-4854-a4d2-1f6408497e46',
  '639d3431-5be1-4096-a964-604a8fae0cf7',
  'ccd01946-a4e3-42d4-8127-d3a1bb3978b7',
  '1a17eea9-2705-4c95-9660-1a2114045754',
  'b2553e13-8f79-400c-83be-df796d5a6951',
  '059f25a0-9fed-4784-a80c-70ad160144ab',
  'c9b91d69-feaf-49f1-8261-b0e737b3ac09',
  '79bb051b-d566-43f1-b760-d7f7c2384763',
  '527a0d22-3b6a-45a4-be44-2ec1b9a0ded0',
  'b6134793-a131-4fae-a722-6dc0515c4723',
  '52a01ede-59c1-48a0-b0f7-7167baf7479d',
  '5d68686b-da49-46e4-97bb-97e781dbd160',
  'd51fc6d9-5ae9-46c7-8ad5-8abee2e6b472',
  '6da3068c-9efc-4942-9bd3-c27b6a979a15',
  '98014c22-46bd-4b4f-9d8b-ea18376eac8c',
  '64317b8c-8bfa-46d9-b617-7b39dd52da7f',
];

const CHECK2_OPTIONS = [
  '965fc197-1de5-4efb-aec4-3ad0c89bf5da',
  'f4108ce6-b80a-4257-922f-051a32516172',
];

function randomUUID() {
  return crypto.randomUUID();
}

function randomPick(arr, min = 1, max = null) {
  max = max || arr.length;
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n').map(l => l.trim()).filter(Boolean);
}

async function submit(sui, evm, email, username) {
  const sessionUuid = randomUUID();
  const respondentUuid = randomUUID();

  const payload = {
    sessionUuid,
    respondentUuid,
    responses: {
      [FIELD_IDS.sui]:      sui,
      [FIELD_IDS.evm]:      evm,
      [FIELD_IDS.email]:    email,
      [FIELD_IDS.username]: username,
      [FIELD_IDS.checkAll]: randomPick(CHECK_ALL_OPTIONS, 3, 10),
      [FIELD_IDS.check2]:   CHECK2_OPTIONS,
      [FIELD_IDS.number]:   10,
    },
    captchas: {},
    isCompleted: true,
    password: null,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://tally.so',
      'Referer': 'https://tally.so/',
      'Tally-Version': '2025-01-15',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  const emails    = readLines('email.txt');
  const usernames = readLines('xusername.txt');
  const evms      = readLines('evm.txt');
  const suis      = readLines('sui.txt');

  const total = emails.length;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));

  console.log(`Total akun: ${total}`);
  console.log('[1] Single akun');
  console.log('[2] Dari akun X sampai akhir');

  const mode = (await ask('Pilih mode: ')).trim();

  let start = 0, end = total;

  if (mode === '1') {
    const idx = parseInt(await ask(`Pilih akun (1-${total}): `)) - 1;
    start = idx; end = idx + 1;
  } else if (mode === '2') {
    start = parseInt(await ask(`Mulai dari akun ke: `)) - 1;
  }

  rl.close();

  for (let i = start; i < end; i++) {
    const sui      = suis[i]      || '';
    const evm      = evms[i]      || '';
    const email    = emails[i]    || '';
    const username = usernames[i] || '';

    process.stdout.write(`[${i+1}/${total}] ${email} ... `);

    try {
      const { status, data } = await submit(sui, evm, email, username);
      if (status === 200 && data.submissionId) {
        console.log(`OK | submissionId: ${data.submissionId}`);
      } else {
        console.log(`GAGAL | ${JSON.stringify(data)}`);
      }
    } catch (e) {
      console.log(`ERROR | ${e.message}`);
    }

    if (i < end - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('Selesai.');
}

main();
