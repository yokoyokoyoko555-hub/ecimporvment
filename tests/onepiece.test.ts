import assert from "node:assert/strict";
import test from "node:test";
import {
  parseOnePieceCards,
  parseTierOneOnePieceCards,
} from "../lib/onepiece";

const card = (id: string, image: string) => `
  <dl class="modalCol" id="${id}">
    <div class="infoCol"><span>OP17-022</span><span>SR</span><span>キャラクター</span></div>
    <div class="cardName">シャンクス</div>
    <div class="frontCol"><img data-src="${image}?v=1"></div>
    <div class="color"><h3>色</h3>緑</div>
    <div class="cost"><h3>コスト</h3>7</div>
    <div class="power"><h3>パワー</h3>7000</div>
    <div class="attribute"><img alt="斬"></div>
    <div class="feature"><h3>特徴</h3>赤髪海賊団</div>
    <div class="text"><h3>テキスト</h3>効果テキスト</div>
  </dl>`;

test("ONE PIECE公式カードリストの通常・パラレルを解析する", () => {
  const html = card("OP17-022", "/images/base.png")
    + card("OP17-022_p1", "/images/p1.png")
    + card("OP17-022_p2", "/images/p2.png");
  const cards = parseOnePieceCards(html, "https://www.onepiece-cardgame.com/cardlist/?series=550117");

  assert.equal(cards.length, 3);
  assert.deepEqual(cards.map((item) => item.variationCode), ["N", "P1", "P2"]);
  assert.deepEqual(cards.map((item) => item.rarity), ["SR", "パラレル", "スーパーパラレル"]);
  assert.deepEqual(cards[0].colors, ["緑"]);
  assert.equal(cards[0].playCost, 7);
  assert.equal(cards[0].dp, 7000);
  assert.equal(cards[2].imageUrl, "https://www.onepiece-cardgame.com/images/p2.png");
});

test("ティアワンメディアのプロモカード詳細を解析する", () => {
  const html = `
    <p class="wp-block-paragraph"><span class="swl-fz">P-122<span>|</span>P<span>|</span>LEADER</span></p>
    <p class="wp-block-paragraph"><strong><span>エース＆サボ＆ルフィ</span></strong></p>
    <div class="wp-block-columns">
      <figure class="wp-block-image"><img data-src="https://tierone-media-op.com/wp-content/uploads/p-122.webp?x=1"></figure>
      <table><tbody>
        <tr><td><strong>ライフ</strong></td><td>5</td><td><strong>属性</strong></td><td>打</td></tr>
        <tr><td><strong>パワー</strong></td><td>5000</td><td><strong>色</strong></td><td>赤</td></tr>
        <tr><td colspan="4"><strong>特徴</strong><br>海軍</td></tr>
        <tr><td colspan="4"><strong>テキスト</strong><br>カードの効果</td></tr>
      </tbody></table>
    </div>`;

  const cards = parseTierOneOnePieceCards(
    html,
    "https://tier-one-onepiece.jp/blog/sample/",
  );
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0], {
    sourceKey: "tierone-p-122-1",
    cardNumber: "P-122",
    variationCode: "N",
    rarity: "P",
    cardType: "LEADER",
    level: null,
    isParallel: false,
    cardName: "エース＆サボ＆ルフィ",
    colors: ["赤"],
    playCost: null,
    dp: 5000,
    form: null,
    attribute: "打",
    traits: "海軍",
    upperText: null,
    lowerText: "カードの効果",
    imageUrl: "https://tierone-media-op.com/wp-content/uploads/p-122.webp",
  });
});

test("ティアワンメディアの概要表はカード詳細として誤検出しない", () => {
  const html = `<table><tr><td>P-122</td><td>P</td><td>エース＆サボ＆ルフィ</td></tr></table>`;
  assert.deepEqual(
    parseTierOneOnePieceCards(
      html,
      "https://tier-one-onepiece.jp/blog/sample/",
    ),
    [],
  );
});

test("リーダーの別イラストはリーダーパラレルとして扱う", () => {
  const html = card("OP17-022", "/images/base.png").replace("<span>SR</span>", "<span>L</span>")
    + card("OP17-022_p1", "/images/p1.png").replace("<span>SR</span>", "<span>L</span>");
  const cards = parseOnePieceCards(html, "https://www.onepiece-cardgame.com/cardlist/?series=550117");
  assert.equal(cards[1].rarity, "リーダーパラレル");
});
