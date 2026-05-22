(function () {
  const VERSION = 8;
  const SIZE = 17 + VERSION * 4;
  const DATA_CODEWORDS = 194;
  const BLOCKS = 2;
  const DATA_PER_BLOCK = 97;
  const ECC_PER_BLOCK = 24;

  window.QRQR = {
    createSvg
  };

  function createSvg(text) {
    const modules = encodeQr(text);
    const border = 4;
    const viewSize = SIZE + border * 2;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${viewSize} ${viewSize}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", text);
    svg.setAttribute("shape-rendering", "crispEdges");

    const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    background.setAttribute("width", viewSize);
    background.setAttribute("height", viewSize);
    background.setAttribute("fill", "#fffdf7");
    svg.appendChild(background);

    let path = "";
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (modules[y][x]) path += `M${x + border},${y + border}h1v1h-1z`;
      }
    }

    const modulesPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    modulesPath.setAttribute("d", path);
    modulesPath.setAttribute("fill", "#15110f");
    svg.appendChild(modulesPath);
    return svg;
  }

  function encodeQr(text) {
    const data = makeDataCodewords(text);
    const codewords = addErrorCorrection(data);
    let best = null;

    for (let mask = 0; mask < 8; mask += 1) {
      const qr = makeBaseMatrix();
      drawCodewords(qr, codewords);
      applyMask(qr, mask);
      drawFormatBits(qr, mask);
      const score = penaltyScore(qr.modules);
      if (!best || score < best.score) best = { modules: qr.modules, score };
    }

    return best.modules;
  }

  function makeDataCodewords(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    if (bytes.length > 152) {
      throw new Error("QR text is too long for this local QR encoder.");
    }

    const bits = [];
    appendBits(bits, 0x4, 4);
    appendBits(bits, bytes.length, 8);
    bytes.forEach(byte => appendBits(bits, byte, 8));

    const capacity = DATA_CODEWORDS * 8;
    appendBits(bits, 0, Math.min(4, capacity - bits.length));
    while (bits.length % 8) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      codewords.push(parseInt(bits.slice(i, i + 8).join(""), 2));
    }

    for (let pad = 0; codewords.length < DATA_CODEWORDS; pad += 1) {
      codewords.push(pad % 2 === 0 ? 0xec : 0x11);
    }

    return codewords;
  }

  function addErrorCorrection(data) {
    const blocks = [];
    for (let i = 0; i < BLOCKS; i += 1) {
      const start = i * DATA_PER_BLOCK;
      const block = data.slice(start, start + DATA_PER_BLOCK);
      blocks.push({
        data: block,
        ecc: reedSolomon(block, ECC_PER_BLOCK)
      });
    }

    const result = [];
    for (let i = 0; i < DATA_PER_BLOCK; i += 1) {
      for (const block of blocks) result.push(block.data[i]);
    }
    for (let i = 0; i < ECC_PER_BLOCK; i += 1) {
      for (const block of blocks) result.push(block.ecc[i]);
    }
    return result;
  }

  function makeBaseMatrix() {
    const modules = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const reserved = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    const qr = { modules, reserved };

    drawFinder(qr, 3, 3);
    drawFinder(qr, SIZE - 4, 3);
    drawFinder(qr, 3, SIZE - 4);
    drawTiming(qr);
    drawAlignmentPatterns(qr);
    drawVersionBits(qr);
    setFunction(qr, 8, SIZE - 8, true);
    reserveFormatAreas(qr);

    return qr;
  }

  function drawFinder(qr, cx, cy) {
    for (let y = -4; y <= 4; y += 1) {
      for (let x = -4; x <= 4; x += 1) {
        const xx = cx + x;
        const yy = cy + y;
        if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;
        const dist = Math.max(Math.abs(x), Math.abs(y));
        setFunction(qr, xx, yy, dist !== 2 && dist !== 4);
      }
    }
  }

  function drawTiming(qr) {
    for (let i = 8; i < SIZE - 8; i += 1) {
      setFunction(qr, i, 6, i % 2 === 0);
      setFunction(qr, 6, i, i % 2 === 0);
    }
  }

  function drawAlignmentPatterns(qr) {
    const positions = [6, 24, 42];
    for (let row = 0; row < positions.length; row += 1) {
      for (let column = 0; column < positions.length; column += 1) {
        const x = positions[column];
        const y = positions[row];
        const overlapsTopLeft = row === 0 && column === 0;
        const overlapsTopRight = row === 0 && column === positions.length - 1;
        const overlapsBottomLeft = row === positions.length - 1 && column === 0;
        if (overlapsTopLeft || overlapsTopRight || overlapsBottomLeft) continue;
        drawAlignment(qr, x, y);
      }
    }
  }

  function drawAlignment(qr, cx, cy) {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        const dist = Math.max(Math.abs(x), Math.abs(y));
        setFunction(qr, cx + x, cy + y, dist !== 1);
      }
    }
  }

  function drawVersionBits(qr) {
    let bits = VERSION;
    for (let i = 0; i < 12; i += 1) {
      bits = (bits << 1) ^ (((bits >>> 11) & 1) ? 0x1f25 : 0);
    }
    bits = (VERSION << 12) | (bits & 0xfff);

    for (let i = 0; i < 18; i += 1) {
      const bit = ((bits >>> i) & 1) === 1;
      const a = SIZE - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunction(qr, a, b, bit);
      setFunction(qr, b, a, bit);
    }
  }

  function reserveFormatAreas(qr) {
    for (let i = 0; i < 9; i += 1) {
      if (i !== 6) {
        qr.reserved[8][i] = true;
        qr.reserved[i][8] = true;
      }
    }
    for (let i = 0; i < 8; i += 1) {
      qr.reserved[SIZE - 1 - i][8] = true;
      qr.reserved[8][SIZE - 1 - i] = true;
    }
  }

  function drawCodewords(qr, codewords) {
    const bits = [];
    codewords.forEach(codeword => appendBits(bits, codeword, 8));

    let index = 0;
    let upward = true;
    for (let right = SIZE - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;
      for (let vert = 0; vert < SIZE; vert += 1) {
        const y = upward ? SIZE - 1 - vert : vert;
        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          if (qr.reserved[y][x]) continue;
          qr.modules[y][x] = bits[index] === 1;
          index += 1;
        }
      }
      upward = !upward;
    }

    if (index !== bits.length) {
      throw new Error(`QR placement mismatch: expected ${bits.length} bits, placed ${index}.`);
    }
  }

  function applyMask(qr, mask) {
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (qr.reserved[y][x]) continue;
        if (maskBit(mask, x, y)) qr.modules[y][x] = !qr.modules[y][x];
      }
    }
  }

  function drawFormatBits(qr, mask) {
    const data = (1 << 3) | mask;
    let bits = data;
    for (let i = 0; i < 10; i += 1) {
      bits = (bits << 1) ^ (((bits >>> 9) & 1) ? 0x537 : 0);
    }
    bits = ((data << 10) | (bits & 0x3ff)) ^ 0x5412;

    for (let i = 0; i <= 5; i += 1) setFunction(qr, 8, i, bitAt(bits, i));
    setFunction(qr, 8, 7, bitAt(bits, 6));
    setFunction(qr, 8, 8, bitAt(bits, 7));
    setFunction(qr, 7, 8, bitAt(bits, 8));
    for (let i = 9; i < 15; i += 1) setFunction(qr, 14 - i, 8, bitAt(bits, i));

    for (let i = 0; i < 8; i += 1) setFunction(qr, SIZE - 1 - i, 8, bitAt(bits, i));
    for (let i = 8; i < 15; i += 1) setFunction(qr, 8, SIZE - 15 + i, bitAt(bits, i));
    setFunction(qr, 8, SIZE - 8, true);
  }

  function setFunction(qr, x, y, value) {
    qr.modules[y][x] = value;
    qr.reserved[y][x] = true;
  }

  function maskBit(mask, x, y) {
    if (mask === 0) return (x + y) % 2 === 0;
    if (mask === 1) return y % 2 === 0;
    if (mask === 2) return x % 3 === 0;
    if (mask === 3) return (x + y) % 3 === 0;
    if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    if (mask === 5) return ((x * y) % 2) + ((x * y) % 3) === 0;
    if (mask === 6) return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }

  function penaltyScore(modules) {
    let score = 0;
    for (let y = 0; y < SIZE; y += 1) score += runPenalty(modules[y]);
    for (let x = 0; x < SIZE; x += 1) score += runPenalty(modules.map(row => row[x]));

    for (let y = 0; y < SIZE - 1; y += 1) {
      for (let x = 0; x < SIZE - 1; x += 1) {
        const color = modules[y][x];
        if (modules[y][x + 1] === color && modules[y + 1][x] === color && modules[y + 1][x + 1] === color) {
          score += 3;
        }
      }
    }

    const pattern = "10111010000";
    const reverse = "00001011101";
    for (let y = 0; y < SIZE; y += 1) {
      const row = modules[y].map(Boolean).map(value => value ? "1" : "0").join("");
      score += finderPenalty(row, pattern, reverse);
    }
    for (let x = 0; x < SIZE; x += 1) {
      const column = modules.map(row => row[x] ? "1" : "0").join("");
      score += finderPenalty(column, pattern, reverse);
    }

    const dark = modules.flat().filter(Boolean).length;
    const percent = (dark * 100) / (SIZE * SIZE);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return score;
  }

  function runPenalty(line) {
    let score = 0;
    let runColor = line[0];
    let runLength = 1;

    for (let i = 1; i < line.length; i += 1) {
      if (line[i] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) score += 3 + runLength - 5;
        runColor = line[i];
        runLength = 1;
      }
    }

    if (runLength >= 5) score += 3 + runLength - 5;
    return score;
  }

  function finderPenalty(line, pattern, reverse) {
    let score = 0;
    for (let index = line.indexOf(pattern); index !== -1; index = line.indexOf(pattern, index + 1)) score += 40;
    for (let index = line.indexOf(reverse); index !== -1; index = line.indexOf(reverse, index + 1)) score += 40;
    return score;
  }

  function reedSolomon(data, degree) {
    const generator = rsGenerator(degree);
    const result = Array(degree).fill(0);

    for (const byte of data) {
      const factor = byte ^ result.shift();
      result.push(0);
      for (let i = 0; i < degree; i += 1) {
        result[i] ^= gfMultiply(generator[i], factor);
      }
    }

    return result;
  }

  function rsGenerator(degree) {
    let result = [1];
    for (let i = 0; i < degree; i += 1) {
      const next = Array(result.length + 1).fill(0);
      for (let j = 0; j < result.length; j += 1) {
        next[j] ^= gfMultiply(result[j], 1);
        next[j + 1] ^= gfMultiply(result[j], gfPow(2, i));
      }
      result = next;
    }
    return result.slice(1);
  }

  function gfMultiply(a, b) {
    let result = 0;
    for (let i = 0; i < 8; i += 1) {
      if ((b & 1) !== 0) result ^= a;
      const high = (a & 0x80) !== 0;
      a = (a << 1) & 0xff;
      if (high) a ^= 0x1d;
      b >>>= 1;
    }
    return result;
  }

  function gfPow(value, power) {
    let result = 1;
    for (let i = 0; i < power; i += 1) result = gfMultiply(result, value);
    return result;
  }

  function appendBits(target, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) {
      target.push((value >>> i) & 1);
    }
  }

  function bitAt(value, index) {
    return ((value >>> index) & 1) === 1;
  }
})();
