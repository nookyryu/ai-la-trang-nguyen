// Đẩy mã nguồn game lên GitHub công khai: https://github.com/nookyryu/ai-la-trang-nguyen
// Cách dùng (trong thư mục game):  node tools/day-github.mjs "Lời mô tả thay đổi"
// - Chỉ đẩy file đang được git (thư mục Tools) theo dõi, KHÔNG đẩy docs/ và ttl-live/
//   (ttl-live có kèm mã ký của TikTok, không công khai).
// - Phải commit ở git Tools trước; script tự tải repo GitHub về thư mục Temp, chép file, commit, push.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'https://github.com/nookyryu/ai-la-trang-nguyen.git';
const BO_QUA = [/^docs\//, /^ttl-live\//];
const msg = process.argv[2];
if (!msg) { console.error('Thiếu lời mô tả: node tools/day-github.mjs "..."'); process.exit(1); }

const game = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

if (git(game, 'status', '--porcelain', '--', '.').trim()) {
  console.error('Còn thay đổi chưa commit trong thư mục game. Commit ở git Tools trước rồi mới đẩy.');
  process.exit(1);
}
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'day-tn-'));
try {
  git(tam, 'clone', '-q', REPO, '.');
  for (const f of git(tam, 'ls-files', '-z').split('\0').filter(Boolean)) fs.rmSync(path.join(tam, f), { force: true });
  const ds = git(game, 'ls-files', '-z', '--', '.').split('\0').filter((f) => f && !BO_QUA.some((r) => r.test(f)));
  for (const f of ds) {
    fs.mkdirSync(path.dirname(path.join(tam, f)), { recursive: true });
    fs.copyFileSync(path.join(game, f), path.join(tam, f));
  }
  git(tam, 'add', '-A');
  if (!git(tam, 'status', '--porcelain').trim()) { console.log('GitHub đã giống bản trên máy, không có gì để đẩy.'); process.exit(0); }
  const ten = git(game, 'config', 'user.name').trim(), mail = git(game, 'config', 'user.email').trim();
  git(tam, '-c', `user.name=${ten}`, '-c', `user.email=${mail}`, 'commit', '-q', '-m', msg);
  git(tam, 'push', '-q', 'origin', 'HEAD:main');
  console.log('Đã đẩy:', git(tam, 'log', '--oneline', '-1').trim(), `(${ds.length} file)`);
} finally {
  fs.rmSync(tam, { recursive: true, force: true });
}
