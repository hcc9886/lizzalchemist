// 实验14（v3 引擎试点）：加热高锰酸钾制氧气 —— 分层工作台 + 步骤状态机 + 安全红绿灯
// 2KMnO₄ --Δ--> K₂MnO₄ + MnO₂ + O₂↑（排水法收集）
import { Workbench } from '../engine/workbench.js';
import { createExpUI } from '../engine/panel.js';
import { createProcedure, logReportHTML } from '../engine/fsm.js';
import { achieve } from '../expkit.js';
import { openModal } from '../progress.js';

let raf = null, state = null, bench = null, ui = null, proc = null, ctxRef = null, t0 = 0, tLast = 0;
const WATER = '#3f7fb5';

const STEPS = [
  { id: 'assemble', text: '组装发生装置', allow: ['assemble'],
    block: ['heat'], blockMsg: '装置还没组装好，绝对不能点火！',
    detail: '把<b>铁夹</b>装到铁架台立杆上，再把<b>试管</b>拖到铁夹处（自动呈"口略向下"倾斜），最后把<b>带导管的单孔橡胶塞</b>塞住试管口，<b>水槽</b>放到右侧桌面。',
    tips: '试管口略向下倾斜是铁律：防止冷凝水倒流到热的管底引起炸裂。',
    done: s => s.assembledBase && !!s.trough },
  { id: 'seal', text: '检查装置气密性', allow: ['assemble', 'check'],
    block: ['heat'], blockMsg: '必须先检查气密性！装置漏气时收集不到氧气，加热还可能发生危险。',
    detail: '点击右侧<b>"手捂试管"</b>按钮：手温使管内空气受热膨胀，若装置不漏气，导管口会有气泡冒出。',
    tips: '先检查气密性再装药品——漏气的装置装了药也白装。',
    done: s => s.sealed },
  { id: 'load', text: '装入药品并放棉花', allow: ['assemble', 'load'],
    block: ['heat'], blockMsg: '药品还没装，烧什么？先取高锰酸钾。',
    detail: '把<b>药匙</b>拖到<b>高锰酸钾瓶</b>口舀取粉末，再拖到试管口倒入（粉末会洒落管底）。最后把<b>棉花团</b>放到试管口。',
    tips: '棉花挡住高锰酸钾粉末，防止它随气流进入导管把导管堵住、把水槽的水染紫。',
    done: s => s.loaded >= 1 && s.cotton },
  { id: 'heat', text: '点燃酒精灯并加热', allow: ['assemble', 'heat'],
    detail: '把<b>火柴</b>拖到酒精灯灯芯上点燃（禁止对火点燃），再把<b>酒精灯</b>拖到试管正下方。<b>先来回移动预热</b>，约 3 秒后点击"集中加热药品"对准药品部位。',
    tips: '先用外焰来回预热，再集中加热——直接猛烧一点会让试管受热不均而炸裂。',
    done: s => s.steadyHeated },
  { id: 'collect', text: '排水法收集氧气', allow: ['assemble', 'collect', 'heat'],
    detail: '气泡<b>连续、均匀</b>冒出后（前几秒是不均匀的空气，别急着收），点击<b>"放上集气瓶"</b>开始排水收集；集满自动停下。',
    tips: '刚开始的气泡是试管里的空气，此时收集会让氧气不纯。',
    done: s => s.full },
  { id: 'verify', text: '验满：带火星木条复燃', allow: ['collect', 'verify'],
    detail: '把<b>带火星木条</b>拖到集气瓶口——木条<b>复燃</b>即证明氧气已集满。',
    tips: '验满在瓶口进行，不要伸入瓶内太深。',
    done: s => s.verified },
  { id: 'teardown', text: '收尾：先撤导管，后熄灯', allow: ['teardown'],
    block: ['heat'], blockMsg: '实验已在收尾阶段，先撤导管再熄灯。',
    detail: '点击<b>"撤出导管"</b>，再点击<b>"熄灭酒精灯"</b>。顺序绝对不能反！',
    tips: '先熄灯的话管内温度骤降、压强变小，水槽的水会倒吸入热试管——试管当场炸裂。',
    done: s => s.tubeOut && s.lampOff }
];

export default {
  id: 'o2lab', title: '制氧气工作台（分层引擎）', oneLine: '组装装置→查气密性→装药→预热加热→排水收集→验满→先撤导管后熄灯，红绿灯护栏全程护航。',
  tags: ['中学', '排水法', '制气', '红绿灯'],
  safety: ['虚拟实验无危险。现实中学实验室制氧气须在教师指导下进行，试管口不对人，加热前必查气密性。', '高锰酸钾是强氧化剂：远离可燃物，不与浓硫酸/有机物接触。'],
  render(root, ctx) {
    ctxRef = ctx;
    state = {
      assembledBase: false, sealed: false, loaded: 0, cotton: false,
      lampLit: false, lampUnder: false, heating: false, heatT: 0, steadyHeated: false,
      trough: false, collecting: false, full: false, purity: 0.96, puritySet: false,
      verified: false, tubeOut: false, lampOff: false, finished: false,
      mouthDir: 'down', crack: 0, crackSeed: 0, siphon: 0, reburn: 0, jarOut: true
    };

    ui = createExpUI(root, {
      narr: '这是 v3 分层工作台引擎的示范实验：<b>拖拽组装 → 红绿灯护栏 → 粒子级现象</b>。跟着步骤做，注意红灯拦截！',
      goals: [
        { id: 'g1', text: '组装发生装置（试管+塞子+水槽）' },
        { id: 'g2', text: '检查气密性' },
        { id: 'g3', text: '装入药品并放棉花' },
        { id: 'g4', text: '点燃并集中加热' },
        { id: 'g5', text: '排水法收集满一瓶' },
        { id: 'g6', text: '带火星木条验满复燃' },
        { id: 'g7', text: '先撤导管后熄灯安全收尾' }
      ],
      onAllDone: () => finish(true)
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>试管口方向（可做错误示范）</label>
            <select id="o-dir">
              <option value="down">口略向下 ✓ 正确</option>
              <option value="up">口向上 ✗ 错误示范</option>
              <option value="flat">水平 ⚠ 有风险</option>
            </select></div>
          <div class="ctl">
            <button class="btn" id="o-seal" style="width:100%">✋ 手捂试管（检查气密性）</button>
            <button class="btn" id="o-jar" style="width:100%;margin-top:8px">集气瓶放上 / 移开</button>
            <button class="btn ghost" id="o-focus" style="width:100%;margin-top:8px">集中加热药品</button>
          </div>
          <div class="ctl">
            <button class="btn ghost" id="o-pull" style="width:100%">撤出导管</button>
            <button class="btn ghost" id="o-off" style="width:100%;margin-top:8px">熄灭酒精灯</button>
          </div>
          <div class="ctl">
            <button class="btn small" id="o-report" style="width:100%">📋 复盘报告</button>
            <button class="btn small ghost" id="o-reset" style="width:100%;margin-top:6px">重新开始</button>
          </div>
        </aside>
        <section class="exp-stage"><canvas id="o-canvas" width="760" height="470"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">管内温度 <b id="ro-t">25 ℃</b></div>
        <div class="chip">气泡 <b id="ro-b">—</b></div>
        <div class="chip">集气瓶 <b id="ro-v">未收集</b></div>
        <div class="chip">O₂ 纯度 <b id="ro-p">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const cv = $('o-canvas');

    bench = new Workbench(cv, { trayY: 412 });
    bench.setTray([
      { key: 'clamp', label: '铁夹' },
      { key: 'test_tube_20', label: '试管' },
      { key: 'stopper_tube', label: '塞+导管' },
      { key: 'trough', label: '水槽' },
      { key: 'gas_jar_125', label: '集气瓶' },
      { key: 'alcohol_lamp', label: '酒精灯' },
      { key: 'match', label: '火柴' },
      { key: 'spoon', label: '药匙' },
      { key: 'cotton', label: '棉花' },
      { key: 'splint_fire', label: '火星木条' }
    ]);

    // 预置：铁架台 + 高锰酸钾瓶
    const stand = bench.add('iron_stand', 120, 320, { locked: true });
    const kmno4 = bench.add('reagent_bottle_125', 300, 352, { data: { fillColor: '#3d1a52', chemName: 'KMnO₄' } });
    state.stand = stand; state.kmno4 = kmno4;

    proc = createProcedure({ steps: STEPS, guard: guard });
    ui.mountBottom();

    /* ————— 红绿灯全局护栏 ————— */
    function guard(op) {
      if (op === 'heat' && !state.sealed && state.assembledBase)
        return { level: 'red', msg: '红灯：还没检查气密性！漏气的装置收集不到氧气——先手捂试管查气密。' };
      if (op === 'heat' && !state.assembledBase)
        return { level: 'red', msg: '红灯：装置还没组装好，不能点火！' };
      if (op === 'teardown_off' && !state.tubeOut)
        return { level: 'red', msg: '红灯：先熄灯后撤导管——水会倒吸入热试管，试管炸裂！（见演示）' };
      return null;
    }
    function judge(op, extra) {
      const res = proc.evaluate(op, state);
      if (res.level === 'red') {
        bench.flashRed(res.msg);
        ui.lamp('red', res.msg);
        ui.say('<b style="color:#e8907d">' + res.msg + '</b>');
        proc.logOp(op, 'red', res.msg);
      } else if (res.level === 'yellow') {
        bench.flashYellow(res.msg);
        ui.lamp('yellow', res.msg);
        proc.logOp(op, 'yellow', res.msg);
        if (extra !== 'silent') ui.say('⚠ ' + res.msg);
      } else {
        ui.lamp('green', '✓ 操作通过安全检查');
        proc.logOp(op, 'green', extra ? extra.msg || extra : opLabel(op));
      }
      return res.level;
    }
    const opLabel = op => ({
      assemble: '组装/移动器材', check: '检查气密性', load: '取用药品', heat: '点火/加热',
      collect: '收集气体', verify: '验满', teardown: '实验收尾'
    }[op] || op);

    /* ————— 工作台事件 ————— */
    bench.on.connect = (it, b, snap) => {
      // 塞子→试管口 / 铁夹→立杆 / 试管→铁夹：组装
      if ((it.key === 'stopper_tube' && b.key.startsWith('test_tube')) ||
          (it.key === 'test_tube_20' && b.key === 'clamp') ||
          (it.key === 'clamp' && b.key === 'iron_stand')) {
        judge('assemble', { msg: '连接 ' + it.def.name + ' ↔ ' + b.def.name });
        if (it.key === 'test_tube_20') {
          it.rot = state.mouthDir === 'up' ? -84 : state.mouthDir === 'flat' ? -90 : -96;
          it.locked = true;
          sayAssemble();
        }
        if (it.key === 'stopper_tube') { it.locked = true; sayAssemble(); }
        checkAssembled();
        return true;
      }
      // 酒精灯→试管底部：加热请求
      if (it.key === 'alcohol_lamp' && b.key.startsWith('test_tube')) {
        const lv = judge('heat');
        if (lv === 'red') return false; // 拦截：取消连接
        state.lampUnder = true;
        maybeHeat();
        return true;
      }
      return true;
    };
    bench.on.disconnect = it => {
      if (it.key === 'alcohol_lamp') {
        state.lampUnder = false;
        if (it.fsm && it.fsm.state === 'heating') { it.fsm.to('lit'); state.heating = false; ui.say('酒精灯移开了，加热停止。'); }
      }
      if (it.key === 'stopper_tube' || it.key === 'test_tube_20') { state.assembledBase = false; }
      if (it.key === 'test_tube_20') it.locked = false;
    };
    bench.on.place = it => { placeLogic(it); };
    bench.on.move = it => { placeLogic(it); };
    bench.on.click = it => {
      if (it.key === 'alcohol_lamp' && it.fsm) {
        ui.say(it.fsm.state === 'off' ? '酒精灯还没点燃：把火柴拖到灯芯上。' : '酒精灯已经点燃。可以用"点燃/熄灭"按钮收尾时熄灯。');
      } else if (it.key === 'reagent_bottle_125') {
        ui.say('<b>高锰酸钾 KMnO₄</b>：紫黑色固体，强氧化剂。用药匙取约 2 g，铺满试管底部。');
      }
    };

    function sayAssemble() {
      ui.say(state.mouthDir === 'up' ? '⚠ 试管口朝上——加热固体时这是<b>错误</b>的（冷凝水会倒流炸裂试管），点"集中加热"试试红绿灯会怎样！'
        : '试管已固定，口略向下倾斜 ✓。接着塞上<b>带导管的橡胶塞</b>。');
    }
    function checkAssembled() {
      const tube = bench.items.find(i => i.key === 'test_tube_20');
      const stopper = bench.items.find(i => i.key === 'stopper_tube');
      state.assembledBase = !!(tube && stopper && bench.links.some(l =>
        (l.a === tube && l.b === stopper) || (l.a === stopper && l.b === tube)));
    }
    function placeLogic(it) {
      // 水槽放右侧
      if (it.key === 'trough') {
        it.x = Math.min(Math.max(it.x, 380), 640); it.y = 330;
        state.trough = true;
        checkAssembled();
        proc.logOp('assemble', 'green', '放置水槽');
        return;
      }
      // 集气瓶拖进水槽 → 倒扣收集
      if (it.key === 'gas_jar_125' && state.trough && it.y > 240 && it.y < 380 && it.x > 360) {
        submergeJar(it);
        return;
      }
      // 药匙舀药
      if (it.key === 'spoon') {
        const km = state.kmno4;
        if (!it.data.loaded && Math.hypot(it.x - km.x, it.y - km.y) < 46) {
          it.data.loaded = true; it.data.powderColor = '#3d1a52';
          judge('load', { msg: '药匙舀取高锰酸钾' });
          ui.say('舀到高锰酸钾粉末了！现在拖到<b>试管口</b>倒入。');
          return;
        }
        const tube = bench.items.find(i => i.key === 'test_tube_20');
        if (it.data.loaded && tube && Math.hypot(it.x - tube.x + 40, it.y - tube.y) < 52) {
          it.data.loaded = false;
          state.loaded++;
          const mouth = bench.anchor(tube, tube.def.interfaces[0]);
          for (let i = 0; i < 26; i++) bench.fx.emitStream(mouth[0], mouth[1], 0.3, 0.4, '#3d1a52', 1, tube.y + 18);
          judge('load', { msg: '高锰酸钾倒入试管（第 ' + state.loaded + ' 药匙）' });
          ui.say('紫黑色粉末落入试管底 ✓。' + (state.cotton ? '' : '别忘了<b>棉花团</b>放管口！'));
        }
        return;
      }
      // 棉花
      if (it.key === 'cotton') {
        const tube = bench.items.find(i => i.key === 'test_tube_20');
        if (tube) {
          const mouth = bench.anchor(tube, tube.def.interfaces[0]);
          if (Math.hypot(it.x - mouth[0], it.y - mouth[1]) < 40) {
            bench.remove(it); state.cotton = true;
            judge('load', { msg: '棉花团放试管口' });
            ui.say('棉花已堵住管口 ✓ 药品准备完成。可以<b>点燃酒精灯</b>了。');
          }
        }
        return;
      }
      // 火柴点灯
      if (it.key === 'match') {
        const lamp = bench.items.find(i => i.key === 'alcohol_lamp');
        if (lamp && Math.hypot(it.x - lamp.x, it.y - lamp.y) < 44) {
          bench.remove(it);
          lightLamp(lamp);
        }
        return;
      }
      // 带火星木条验满
      if (it.key === 'splint_fire') {
        const jar = bench.items.find(i => i.key === 'gas_jar_125');
        if (jar && state.collecting && Math.hypot(it.x - jar.x, it.y - (jar.y - jar.def.h / 2)) < 46) {
          if (state.full) {
            bench.remove(it); state.verified = true; state.reburn = 50;
            for (let i = 0; i < 18; i++) bench.fx.emitStream(jar.x, jar.y - jar.def.h / 2, (Math.random() - 0.5) * 1.6, -1.2, '#f0c96a', 1, jar.y - 120);
            ui.eq('木条<b>复燃</b> → 瓶口气体是<b>氧气</b>（O₂ 助燃）');
            judge('verify', { msg: '带火星木条在瓶口复燃——验满成功' });
          } else {
            bench.remove(it);
            judge('verify', 'silent');
            ui.say('⚠ 还没收集满，木条不会复燃——再等瓶里的水被排完。');
          }
        }
        return;
      }
      // 酒精灯随处放置：提醒拖到试管下
      if (it.key === 'alcohol_lamp' && it.fsm && it.fsm.state !== 'off' && !state.lampUnder) {
        ui.say('灯点燃了！把它<b>拖到试管正下方</b>开始加热。');
      }
    }
    function submergeJar(jar) {
      if (state.collecting) return;
      jar.rot = 180; jar.locked = true;
      jar.x = 452; jar.y = 318;
      jar.liq = { vol: jar.cap, color: WATER, max: jar.cap, wave: 0, vortex: 0 };
      state.collecting = true; state.jarOut = false;
      // 收集时机教学：加热未稳时盖上 → 空气混入
      if (!state.puritySet) {
        state.puritySet = true;
        if (state.heating && state.heatT < 2) {
          state.purity = 0.72;
          proc.logOp('collect', 'yellow', '气泡未均匀时就开始收集 → O₂ 纯度仅约 72%');
          ui.lamp('yellow', '收集时机不当（黄灯已记录）');
          ui.say('⚠ 现在气泡还不均匀（装置内的空气）——此时收集，氧气纯度只有约 <b>72%</b>。教科书说"等连续均匀再收集"就是这个原因。');
          ui.eq('收集过早：瓶内混入装置原有空气 → O₂ 纯度下降');
        } else {
          state.purity = 0.96;
          judge('collect', { msg: '集气瓶倒扣入水开始收集' });
          ui.say('集气瓶倒扣入水槽，导管口伸入瓶内 ✓ 气泡把水排出，氧气渐渐占满瓶子。');
        }
      } else judge('collect', { msg: '重新放上集气瓶继续收集' });
    }
    function lightLamp(lamp) {
      const lv = judge('heat');
      if (lv === 'red') return;
      if (lamp.fsm && lamp.fsm.state === 'off') {
        lamp.fsm.to('lit');
        state.lampLit = true;
        proc.logOp('heat', 'green', '点燃酒精灯');
        ui.say(state.lampUnder ? '灯点燃且正对试管底部 ✓' : '灯点燃了！把它<b>拖到试管正下方</b>。');
        maybeHeat();
      }
    }
    function maybeHeat() {
      const lamp = bench.items.find(i => i.key === 'alcohol_lamp');
      if (!lamp || !state.lampLit || !state.lampUnder) return;
      if (lamp.fsm.state !== 'heating') {
        // 试管口方向检查
        if (state.mouthDir === 'up') {
          judge('heat');
          bench.flashRed('红灯：试管口朝上加热固体！冷凝水会倒流到灼热的管底——试管炸裂！（已演示，自动纠正为口略向下）');
          ui.lamp('red', '试管口方向错误已拦截，自动纠正');
          state.mouthDir = 'down';
          const dir = $('o-dir'); if (dir) dir.value = 'down';
          const tube = bench.items.find(i => i.key === 'test_tube_20');
          if (tube) tube.rot = -96;
          proc.logOp('heat', 'red', '试管口向上加热 → 红灯拦截并纠正');
        } else if (state.mouthDir === 'flat') {
          judge('heat');
          ui.say('⚠ 试管水平放置：冷凝水可能积在管口流向药品，建议口略向下（已继续，记一次黄灯）。');
        } else {
          judge('heat', { msg: '开始预热（来回移动外焰）' });
        }
        lamp.fsm.to('heating');
        state.heating = true; state.heatT = 0;
        ui.say('<b>预热中</b>：外焰来回移动约 3 秒（演示加速），然后点"集中加热药品"。');
      }
    }

    /* ————— 按钮 ————— */
    $('o-seal').onclick = () => {
      if (!state.assembledBase) { judge('check', 'silent'); ui.say('⚠ 装置还没连接完整（试管+塞子+导管），检查无从谈起。'); return; }
      if (!state.trough) { judge('check', 'silent'); ui.say('⚠ 导管口还没伸入水中（先放水槽），看不见气泡怎么判断漏不漏？'); return; }
      state.sealed = true;
      for (let i = 0; i < 14; i++) bench.fx.emitBubble(450 + Math.random() * 8, 350, 314, 1.5 + Math.random() * 2);
      judge('check', { msg: '手捂试管：导管口冒出气泡 → 气密性良好 ✓' });
      ui.eq('手温使管内空气膨胀 → 不漏气的装置在水中冒泡 = 气密性 ✓');
      ui.say('✅ <b>气密性良好</b>！现在可以装药品了：药匙 → 高锰酸钾瓶。');
    };
    $('o-jar').onclick = () => {
      let jar = bench.items.find(i => i.key === 'gas_jar_125');
      if (state.collecting && jar) {
        bench.breakLinks(jar); jar.rot = 0; jar.locked = false; jar.y = 200; jar.x = 620; state.collecting = false; state.jarOut = true;
        ui.say('集气瓶移开了（暂停收集）。');
      } else if (!state.trough) { ui.say('⚠ 先把水槽放到桌面右侧。'); }
      else {
        if (!jar) jar = bench.add('gas_jar_125', 470, 300);
        submergeJar(jar);
      }
    };
    $('o-focus').onclick = () => {
      if (!state.heating) { ui.say('⚠ 还没开始加热：点燃酒精灯并拖到试管下方。'); return; }
      if (state.heatT < 2) {
        proc.logOp('heat', 'yellow', '未预热就集中加热（黄灯提醒）');
        ui.lamp('yellow', '建议先预热再集中加热');
        ui.say('⚠ <b>先预热再集中加热</b>！直接猛烧一点，试管受热不均容易炸裂（记一次黄灯，继续加热）。');
        return;
      }
      judge('heat', { msg: '集中加热药品部位' });
      state.focusHeat = true;
    };
    $('o-pull').onclick = () => {
      if (!state.full) { ui.say('⚠ 实验还没到收尾阶段（先收集满、验满）。'); return; }
      state.tubeOut = true;
      judge('teardown', { msg: '撤出导管 ✓（下一步：熄灭酒精灯）' });
      ui.say('导管已从水槽撤出 ✓。<b>最后一步：熄灭酒精灯</b>。');
    };
    $('o-off').onclick = () => {
      const lamp = bench.items.find(i => i.key === 'alcohol_lamp');
      if (!lamp || lamp.fsm.state === 'off') { ui.say('灯本来就没点。'); return; }
      if (!state.tubeOut) {
        // 红灯 + 水倒吸演示
        judge('teardown_off');
        state.crack = 160; state.crackSeed = Math.random() * 1000; state.siphon = 90;
        lamp.fsm.to('off'); state.heating = false; state.lampOff = true;
        ui.eq('先熄灯 → 管内降温压强变小 → <b>水倒吸</b> → 热试管骤冷炸裂 💥');
        ui.say('💥 <b>试管炸裂了！</b>演示完毕。现实中这会导致实验失败甚至伤人——顺序铁律：<b>先撤导管，后熄灯</b>。系统已重置演示状态。');
        setTimeout(() => { state.tubeOut = true; ui.say('（演示恢复）现在按正确顺序收尾：导管已撤出 ✓'); }, 2600);
        return;
      }
      lamp.fsm.to('off'); state.lampOff = true; state.heating = false;
      judge('teardown', { msg: '熄灭酒精灯（盖灯帽，禁止吹灭）' });
      ui.say('酒精灯用<b>灯帽盖灭</b> ✓（严禁吹灭）。全流程安全完成！');
    };
    $('o-dir').onchange = e => {
      state.mouthDir = e.target.value;
      const tube = bench.items.find(i => i.key === 'test_tube_20');
      if (tube && !state.heating) {
        tube.rot = state.mouthDir === 'up' ? -84 : state.mouthDir === 'flat' ? -90 : -96;
        ui.say(state.mouthDir === 'up' ? '⚠ 已切到"口向上"错误示范——现在点火试试红绿灯的反应。' : '试管口方向已调整。');
      }
    };
    $('o-report').onclick = () => openModal(logReportHTML(proc) +
      '<p style="margin-top:10px"><button class="btn small" onclick="document.getElementById(\'modal-root\').innerHTML=\'\'">关闭</button></p>');
    $('o-reset').onclick = () => { reset(); };
    function reset() {
      cancelAnimationFrame(raf); raf = null;
      ui.destroy();
      root.innerHTML = '';
      _EX.o2lab.render(root, ctxRef);
    }

    /* ————— 完成与记录 ————— */
    function finish(all) {
      if (state.finished) return;
      state.finished = true;
      achieve('o2_master');
      if (proc.stats.red === 0 && all) achieve('safety_perfect');
      ui.eq('2KMnO₄ --Δ--> K₂MnO₄ + MnO₂ + O₂↑ · 全流程安全完成');
      openModal(logReportHTML(proc) +
        '<p style="margin-top:10px"><button class="btn small" onclick="document.getElementById(\'modal-root\').innerHTML=\'\'">关闭</button></p>');
      if (ctxRef.record) ctxRef.record({ experiment: 'o2lab', mode: '红绿灯全流程' }, {
        o2Purity: Math.round(state.purity * 100) + '%', 红灯次数: proc.stats.red, 黄灯次数: proc.stats.yellow,
        评分: proc.report().score
      });
    }

    /* ————— 帧循环 ————— */
    const roT = $('ro-t'), roB = $('ro-b'), roV = $('ro-v'), roP = $('ro-p');
    let uiClock = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(3, t - (tLast || t)); tLast = t;
      bench.fx.update(1);
      const lamp = bench.items.find(i => i.key === 'alcohol_lamp');
      const tube = bench.items.find(i => i.key === 'test_tube_20');
      const jar = bench.items.find(i => i.key === 'gas_jar_125');

      // 加热推进
      if (state.heating && lamp && lamp.fsm.state === 'heating') {
        state.heatT += dt / 60;
        if (state.heatT > 3 && !state.steadyHeated) {
          state.steadyHeated = true;
          ui.say('预热完成，药品部位已集中加热。反应开始：<b>紫黑色固体逐渐变黑，气泡冒出</b>。');
        }
        if (Math.random() < 0.25) bench.fx.emitSmoke(tube ? bench.anchor(tube, tube.def.interfaces[2])[0] : 200, tube ? bench.anchor(tube, tube.def.interfaces[2])[1] - 30 : 230, 'rgba(180,170,200,.35)', 1);
      }

      // 气泡阶段
      const phase = state.heating ? (state.heatT < 1.2 ? 'irregular' : state.heatT < 2 ? 'gap' : 'steady') : 'none';
      if (phase !== 'none' && phase !== 'gap') {
        if (Math.random() < 0.6) {
          const inJar = state.collecting && jar;
          bench.fx.emitBubble(450, 350, inJar ? 357 - 72 * jar.gasFrac : 314, 1.5 + Math.random() * 2);
        }
      }
      if (state.collecting && jar && phase === 'steady' && jar.gasFrac < 1) {
        jar.gasFrac = Math.min(1, jar.gasFrac + 0.0035 * dt / 16);
        if (jar.gasFrac >= 0.95 && !state.full) {
          state.full = true;
          ui.eq('集气瓶集满 O₂（排水法：气体把水排出）');
          ui.say('✅ 集满了！把<b>带火星木条</b>拖到瓶口验满。');
        }
      }

      // 水倒吸/炸裂演示
      if (state.siphon > 0) state.siphon--;
      if (state.crack > 0) {
        state.crack -= dt;
        if (Math.random() < 0.4) bench.fx.emitSmoke(200 + Math.random() * 40, 250, 'rgba(200,200,210,.5)', 1);
      }
      if (state.reburn > 0) state.reburn -= dt;

      bench.render(t);
      drawOverlay(t, tube, jar, phase);

      // 步骤自动推进 + 目标同步
      proc.tick(state);
      STEPS.forEach((s, i) => { if (proc.i > i || proc.finished) ui.goal('g' + (i + 1), true); });

      // 读数
      const temp = Math.round(25 + Math.min(285, state.heating ? state.heatT * 55 : 0));
      roT.textContent = temp + ' ℃';
      roB.textContent = phase === 'irregular' ? '不均匀（空气）' : phase === 'steady' ? '连续均匀 ✓' : phase === 'gap' ? '暂停' : '—';
      roV.textContent = jar && state.collecting ? Math.round(jar.gasFrac * 100) + ' %' : '未收集';
      roP.textContent = state.puritySet ? Math.round(state.purity * 100) + ' %' : '—';

      // 六标签节流更新
      uiClock += dt;
      if (uiClock > 320) { uiClock = 0; updateTabs(tube, jar, phase, temp); }
    }

    /* 导管路径 / 倒吸 / 复燃 / 裂纹叠加层 */
    function tubePath(tube) {
      const st = bench.items.find(i => i.key === 'stopper_tube');
      if (!st || !tube) return null;
      const [sx, sy] = bench.anchor(st, st.def.interfaces[1]);
      return [[sx, sy], [sx + 90, sy], [sx + 130, sy + 60], [430, 340], [448, 350]];
    }
    function drawOverlay(g2, tube, jar, phase) {
      const g = bench.g;
      const path = tubePath(tube);
      if (path) {
        g.strokeStyle = 'rgba(160,190,225,.75)'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(path[0][0], path[0][1]);
        for (const p of path.slice(1)) g.lineTo(p[0], p[1]);
        g.stroke();
        g.strokeStyle = 'rgba(200,225,255,.4)'; g.lineWidth = 1.5;
        g.stroke();
        // 倒吸：水沿导管回流
        if (state.siphon > 0) {
          const f = state.siphon / 90;
          const idx = Math.max(1, Math.round(path.length * (1 - f)));
          g.strokeStyle = WATER; g.lineWidth = 5;
          g.beginPath(); g.moveTo(path[path.length - 1][0], path[path.length - 1][1]);
          for (let i = path.length - 2; i >= idx; i--) g.lineTo(path[i][0], path[i][1]);
          g.stroke();
        }
      }
      // 试管裂纹
      if (state.crack > 0 && tube) {
        const rnd = mulberry(state.crackSeed);
        g.strokeStyle = '#e8907d'; g.lineWidth = 1.4;
        for (let i = 0; i < 7; i++) {
          const bx = tube.x + (rnd() - 0.5) * tube.def.h * 0.8;
          const by = tube.y + (rnd() - 0.5) * tube.def.w * 0.9;
          g.beginPath(); g.moveTo(bx, by);
          g.lineTo(bx + (rnd() - 0.5) * 16, by + (rnd() - 0.5) * 16);
          g.lineTo(bx + (rnd() - 0.5) * 24, by + (rnd() - 0.5) * 20);
          g.stroke();
        }
        g.fillStyle = 'rgba(198,90,65,.10)';
        g.fillRect(0, 0, bench.W, bench.H);
      }
      // 复燃金光
      if (state.reburn > 0 && jar) {
        const y = jar.y - jar.def.h / 2;
        g.fillStyle = 'rgba(240,201,106,' + (0.25 + Math.random() * 0.2) + ')';
        g.beginPath(); g.arc(jar.x, y - 10, 26, 0, 7); g.fill();
      }
    }
    function mulberry(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    /* ————— 六标签内容 ————— */
    function updateTabs(tube, jar, phase, temp) {
      // 目标
      ui.setHtml('goal', '<ul class="kit-goals" style="margin:0">' +
        STEPS.map((s, i) => {
          const cur = proc.i === i, fin = proc.i > i || proc.finished;
          return `<li style="${fin ? 'color:#2ea882' : cur ? 'color:#f0c96a' : ''}">${fin ? '✓' : cur ? '▶' : '◻'} ${i + 1}. ${s.text}</li>`;
        }).join('') + '</ul>');
      // 用料
      ui.setRows('bom', [
        ['高锰酸钾 KMnO₄', '约 2 g（药匙×' + Math.max(1, state.loaded) + '）', '氧化剂，分解供氧'],
        ['棉花团', state.cotton ? '1 团（已放管口）✓' : '1 团（待放）', '防粉末进入导管'],
        ['酒精灯 + 火柴', state.lampLit ? '已点燃' : '待点燃', '热源（用外焰）'],
        ['水', '水槽约半槽', '排水法介质'],
        ['装置', '铁架台+铁夹+试管+带导管橡胶塞', '发生装置']
      ], ['品名', '用量/状态', '说明']);
      // 步骤
      const s = proc.step;
      ui.setHtml('step', (s ? `<p><b style="color:#f0c96a">当前 ${proc.i + 1}/${STEPS.length}：${s.text}</b></p><p>${s.detail || ''}</p>${s.tips ? `<p class="muted">💡 ${s.tips}</p>` : ''}` : '<p>🎉 全部步骤完成！</p>') +
        '<ol style="margin:8px 0 0 18px;font-size:13px;color:#a49cc0">' + STEPS.map(x => '<li>' + x.text + '</li>').join('') + '</ol>');
      // 成分
      const r = Math.max(0, Math.min(1, (state.heatT - 2) / 12));
      ui.setRows('comp', [
        ['KMnO₄（固）', Math.round((1 - r) * 100) + '% 剩余', '紫黑色 → 逐渐变黑'],
        ['K₂MnO₄（固）', Math.round(r * 80) + '%', '锰酸钾，黑色固体之一'],
        ['MnO₂（固）', Math.round(r * 20) + '%', '二氧化锰，黑色固体之一'],
        ['O₂（气）', jar && state.collecting ? Math.round(jar.gasFrac * 100) + '% 已收集' : '未收集', '纯度约 ' + (state.puritySet ? Math.round(state.purity * 100) : '—') + '%'],
        ['H₂O（液）', '水槽 ' + (state.trough ? '✓' : '未放置'), '排水法介质'],
        ['管内温度', temp + ' ℃', '反应需持续加热']
      ], ['成分', '比例/状态', '备注']);
      // 数据
      const rows = [
        ['实时', '温度', temp + ' ℃'],
        ['实时', '气泡', phase === 'irregular' ? '不均匀' : phase === 'steady' ? '连续均匀' : '—'],
        ['实时', '已收集', jar && state.collecting ? Math.round(jar.gasFrac * 100) + '%' : '0%']
      ].concat(proc.log.slice(-8).map(l => [new Date(l.t).toLocaleTimeString('zh', { hour12: false }).slice(3), l.level === 'red' ? '🔴' : l.level === 'yellow' ? '🟡' : '🟢', l.msg || l.op]));
      ui.setRows('data', rows, ['时间', '项目/级别', '数值/事件']);
      // 安全
      ui.setHtml('safety', `<ul style="margin:0 0 8px 18px">
        <li>先查<b>气密性</b>再装药、再加热</li>
        <li>试管口<b>略向下倾斜</b>；管口放<b>棉花</b></li>
        <li>先<b>预热</b>再集中加热；用<b>外焰</b></li>
        <li>等气泡<b>连续均匀</b>再收集（不然纯度低）</li>
        <li>收尾铁律：<b>先撤导管，后熄灯</b>（防水倒吸炸裂）</li>
        <li>熄灯用<b>灯帽盖灭</b>，严禁吹灭</li></ul>
        <p class="muted" style="font-size:12.5px">红灯拦截 ${proc.stats.red} 次 · 黄灯提醒 ${proc.stats.yellow} 次</p>`);
    }

    ui.setHtml('goal', '');
    updateTabs(null, null, 'none', 25);
    raf = requestAnimationFrame(frame);
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; bench = null; ui = null; proc = null; state = null; }
};

import { EXPERIMENTS as _EX } from './index.js';
