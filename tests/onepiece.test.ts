import assert from "node:assert/strict";
import test from "node:test";
import { parseOnePieceCards } from "../lib/onepiece";

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

test("リーダーの別イラストはリーダーパラレルとして扱う", () => {
  const html = card("OP17-022", "/images/base.png").replace("<span>SR</span>", "<span>L</span>")
    + card("OP17-022_p1", "/images/p1.png").replace("<span>SR</span>", "<span>L</span>");
  const cards = parseOnePieceCards(html, "https://www.onepiece-cardgame.com/cardlist/?series=550117");
  assert.equal(cards[1].rarity, "リーダーパラレル");
});
