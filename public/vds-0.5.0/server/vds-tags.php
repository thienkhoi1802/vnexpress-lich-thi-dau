<?php
/**
 * VnExpress Design System: dựng thẻ VDS phía server, trước khi gửi trang về trình duyệt.
 * Mã mẫu cho PHP 7.4 trở lên, không cần thư viện ngoài. Cùng quy tắc với vds-tags.mjs và vds-components.js;
 * server viết bằng ngôn ngữ khác làm theo README.md cùng thư mục.
 *
 * HTML viết thẻ VDS: component <vds-button variant="accent">Lưu</vds-button>, icon <vds-icon name="Bookmark__Regular__24">
 * </vds-icon>, logo <vds-logo name="Logo__VnExpress__Standard"></vds-logo>. expand() đổi mọi thẻ thành HTML đầy đủ,
 * nên trang hiện đúng ngay, không cần JS.
 *
 *   require '/var/www/vds-<phiên bản>/server/vds-tags.php';
 *   ob_start([new VdsTags(), 'expand']);  // dựng cả trang trước khi gửi; hoặc echo (new VdsTags())->expand($html);
 *
 * Nguồn ở chỗ khác, vd server VDS của công ty: new VdsTags('https://…/<phiên bản>/') (cần allow_url_fopen).
 * File tải từ nguồn http(s) được lưu đệm trong thư mục tạm của máy, vì bộ phát hành không bao giờ đổi.
 */
final class VdsTags
{
    // Giá trị thuộc tính trong ngoặc kép, ngoặc đơn hoặc không ngoặc; trong ngoặc được có ">".
    const VALUE = '(?:"[^"]*"|\'[^\']*\'|[^\s"\'=<>`]+)';
    const ATTRS = '(?:\s+[^\s"\'=<>/]+(?:\s*=\s*' . self::VALUE . ')?)*';
    // Khoảng trắng theo HTML (space, tab, xuống dòng, form feed, CR), như bản Node.
    const SPACE = '[ \t\n\r\f]';

    /** @var string */
    private $source;
    /** @var string|null */
    private $cacheDir;
    /** @var array<string, string|null> */
    private $files = [];
    /** @var array<string, string|null> */
    private $svgs = [];
    /** @var array<string, string>|null */
    private $renamed = null;
    /** @var array<string, array>|false|null */
    private $components = null;
    /** @var int */
    private $id = 0;

    /**
     * @param string|null $source thư mục bộ phát hành VDS (chứa components/, icons/, logos/), đường dẫn trên server
     *   hoặc địa chỉ http(s). Mặc định: bộ phát hành chứa file này.
     * @param string|null $cacheDir thư mục lưu đệm file tải từ nguồn http(s); mặc định thư mục tạm của máy.
     */
    public function __construct($source = null, $cacheDir = null)
    {
        $this->source = rtrim($source === null ? dirname(__DIR__) : $source, '/\\') . '/';
        $this->cacheDir = $cacheDir === null ? sys_get_temp_dir() . '/vds' : $cacheDir;
    }

    /**
     * Đổi mọi thẻ VDS trong chuỗi HTML thành HTML đầy đủ. Thẻ, tên không có thì giữ nguyên và ghi cảnh báo (error_log).
     * @param string $html
     * @return string
     */
    public function expand($html)
    {
        if ($this->components === null) {
            $json = $this->read('components/vds-templates.json');
            $data = $json === null ? null : json_decode($json, true);
            $this->components = is_array($data) && isset($data['components']) ? $data['components'] : false;
        }
        if ($this->components === false) {
            error_log('VDS: không đọc được components/vds-templates.json, chỉ dựng icon, logo');
        }
        // id tự sinh (vd Input Text Field không có id) đếm lại từ đầu cho mỗi trang.
        $this->id = 0;
        $html = self::upgradeLegacy($html);
        if ($this->components) {
            $html = $this->expandComponents($html);
        }
        $out = preg_replace_callback('~<(vds-icon|vds-logo)(' . self::ATTRS . ')\s*(?:/>|>' . self::SPACE . '*</\1\s*>)~i', function ($m) {
            $kind = substr(strtolower($m[1]), 4);
            $attrs = self::parseAttrs($m[2]);
            $name = self::attr($attrs, 'name');
            if ($name === null) {
                error_log("VDS: <vds-$kind> thiếu thuộc tính name");
                return $m[0];
            }
            if ($kind === 'icon') {
                $name = self::iconName($name, self::attr($attrs, 'size'));
            }
            $file = $this->svgOf($kind, $name);
            $rest = array_values(array_filter($attrs, function ($a) {
                return !preg_match('~^(name|size)$~i', $a[0]);
            }));
            $svg = $file === null ? null : self::toSvg($file, $rest, ["data-vds-$kind", $name]);
            return $svg === null ? $m[0] : $svg;
        }, $html);
        return $out === null ? $html : $out;
    }

    // ─── Thẻ component ───────────────────────────────────────────────────────

    /** Dựng mọi thẻ component, từ ngoài vào trong, tới khi hết thẻ (mẫu có thể sinh thẻ con, vd icon trong button). */
    private function expandComponents($html)
    {
        $unknown = [];
        $render = function ($name, $attrs, $inner) use (&$unknown) {
            if ($name === 'vds-icon' || $name === 'vds-logo') {
                return null;
            }
            if (!isset($this->components[$name])) {
                if (!isset($unknown[$name])) {
                    error_log("VDS: không có thẻ <$name>");
                }
                $unknown[$name] = true;
                return null;
            }
            return $this->renderComponent($this->components[$name], $name, self::parseAttrs($attrs), $inner);
        };
        for ($pass = 0; $pass < 16; $pass++) {
            $next = self::expandOnce($html, $render);
            if ($next === $html) {
                break;
            }
            $html = $next;
        }
        return $html;
    }

    /** Dựng các thẻ ngoài cùng; render trả HTML, hoặc null để giữ thẻ và chỉ dựng phần bên trong. */
    private static function expandOnce($html, callable $render)
    {
        $scan = '~<!--.*?-->|<(script|style|textarea)\b[^>]*>.*?</\1\s*>|<(/?)(vds-[a-zA-Z][\w-]*)(' . self::ATTRS . ')\s*(/?)>~is';
        preg_match_all($scan, $html, $all, PREG_SET_ORDER | PREG_OFFSET_CAPTURE | PREG_UNMATCHED_AS_NULL);
        $out = '';
        $last = 0;
        $stack = [];
        foreach ($all as $m) {
            if (!isset($m[3][0])) {
                continue;
            }
            $name = strtolower($m[3][0]);
            $start = $m[0][1];
            $end = $start + strlen($m[0][0]);
            if ($m[2][0] === '/') {
                $at = -1;
                for ($i = count($stack) - 1; $i >= 0; $i--) {
                    if ($stack[$i]['name'] === $name) {
                        $at = $i;
                        break;
                    }
                }
                if ($at < 0) {
                    continue;
                }
                $open = $stack[$at];
                array_splice($stack, $at);
                if ($at === 0) {
                    $inner = substr($html, $open['end'], $start - $open['end']);
                    $result = $render($name, $open['attrs'], $inner);
                    if ($result !== null) {
                        $out .= substr($html, $last, $open['start'] - $last) . $result;
                        $last = $end;
                    } else {
                        $out .= substr($html, $last, $open['end'] - $last) . self::expandOnce($inner, $render);
                        $last = $start;
                    }
                }
            } elseif ($m[5][0] === '/') {
                if (!$stack) {
                    $result = $render($name, $m[4][0], '');
                    if ($result !== null) {
                        $out .= substr($html, $last, $start - $last) . $result;
                        $last = $end;
                    }
                }
            } else {
                $stack[] = ['name' => $name, 'attrs' => $m[4][0], 'start' => $start, 'end' => $end];
            }
        }
        return $out . substr($html, $last);
    }

    /** Dựng một thẻ component thành HTML theo mẫu của nó (vds-templates.json). */
    private function renderComponent(array $def, $tag, array $attrs, $inner)
    {
        $props = isset($def['props']) ? $def['props'] : [];
        $given = [];
        $rest = [];
        $cls = null;
        foreach ($attrs as $a) {
            $key = strtolower($a[0]);
            if ($key === 'class') {
                $cls = $a[1];
            } elseif (array_key_exists($key, $props)) {
                $given[$key] = $a[1];
            } else {
                $rest[] = $a;
            }
        }
        $scope = [];
        foreach ($props as $key => $prop) {
            if (!empty($prop['boolean'])) {
                $scope[$key] = array_key_exists($key, $given);
                continue;
            }
            $has = array_key_exists($key, $given);
            $value = $has ? $given[$key] : null;
            // Không có giá trị: thuộc tính bật/tắt kiểu `selected` lấy giá trị flag (vd "a"); chuỗi rỗng coi như không có.
            if ($has && ($value === null || $value === '')) {
                $has = isset($prop['flag']);
                $value = $has ? $prop['flag'] : null;
            }
            if ($has && isset($prop['values']) && !array_key_exists($value, $prop['values'])) {
                error_log("VDS: <$tag> $key=\"$value\" không hợp lệ (" . implode(', ', array_keys($prop['values'])) . ')');
                $has = false;
            }
            if ($has && isset($prop['number']) && !(preg_match('~^\d+$~', $value) && (int) $value >= $prop['number'][0] && (int) $value <= $prop['number'][1])) {
                error_log("VDS: <$tag> $key=\"$value\" phải là số từ {$prop['number'][0]} tới {$prop['number'][1]}");
                $has = false;
            }
            if (!$has) {
                $value = !empty($prop['auto']) ? 'vds-' . (++$this->id) : (array_key_exists('default', $prop) ? $prop['default'] : false);
            }
            $scope[$key] = $value;
        }
        // Danh sách sinh từ thuộc tính (vd các ô của Input Code Field): mỗi mục có index (từ 1), first, last, char.
        foreach (isset($def['lists']) ? $def['lists'] : [] as $name => $list) {
            $count = is_string($scope[$list['repeat']]) ? (int) $scope[$list['repeat']] : 0;
            $chars = is_string($scope[$list['chars']]) ? preg_split('//u', $scope[$list['chars']], -1, PREG_SPLIT_NO_EMPTY) : [];
            $items = [];
            for ($i = 0; $i < $count; $i++) {
                $items[] = ['index' => (string) ($i + 1), 'first' => $i === 0, 'last' => $i === $count - 1, 'char' => isset($chars[$i]) ? $chars[$i] : false];
            }
            $scope[$name] = $items;
        }
        $content = preg_replace('~^' . self::SPACE . '+|' . self::SPACE . '+$~', '', $inner);
        $text = preg_replace('~^ | $~', '', preg_replace('~' . self::SPACE . '+~', ' ', preg_replace('~<[^>]*>~', '', $content)));
        $scope['content'] = $content;
        $scope['text'] = $text;
        return self::applyAttrs(self::renderNodes($def['parts']['main'], [$scope], $def['parts']), $rest, $cls);
    }

    /**
     * Mẫu đã biên dịch là cây: chuỗi là HTML; v chèn giá trị (thoát < > "); r chèn nguyên văn; p chèn phần mẫu khác;
     * if, not, in, do là khối điều kiện hoặc lặp.
     */
    private static function renderNodes(array $nodes, array $scopes, array $parts)
    {
        $out = '';
        foreach ($nodes as $node) {
            if (is_string($node)) {
                $out .= $node;
            } elseif (isset($node['v'])) {
                $value = self::lookup($scopes, $node['v']);
                $out .= is_string($value) ? str_replace(['<', '>', '"'], ['&lt;', '&gt;', '&quot;'], $value) : '';
            } elseif (isset($node['r'])) {
                $value = self::lookup($scopes, $node['r']);
                $out .= is_string($value) ? $value : '';
            } elseif (isset($node['p'])) {
                $out .= self::renderNodes($parts[$node['p']], $scopes, $parts);
            } else {
                $value = self::lookup($scopes, $node['if']);
                $not = !empty($node['not']);
                if (isset($node['in'])) {
                    $hit = (is_string($value) && in_array($value, $node['in'], true)) || ($value === true && in_array('true', $node['in'], true));
                    if ($hit !== $not) {
                        $out .= self::renderNodes($node['do'], $scopes, $parts);
                    }
                } elseif (is_array($value) && !$not) {
                    foreach ($value as $item) {
                        $out .= self::renderNodes($node['do'], array_merge($scopes, [$item]), $parts);
                    }
                } elseif (self::truthy($value) !== $not) {
                    $out .= self::renderNodes($node['do'], $scopes, $parts);
                }
            }
        }
        return $out;
    }

    private static function lookup(array $scopes, $name)
    {
        for ($i = count($scopes) - 1; $i >= 0; $i--) {
            if (array_key_exists($name, $scopes[$i])) {
                return $scopes[$i][$name];
            }
        }
        return null;
    }

    private static function truthy($value)
    {
        return $value === true || (is_string($value) && preg_match('~[^ \t\n\r\f]~', $value)) || (is_array($value) && count($value) > 0);
    }

    /**
     * Gắn class của tác giả vào phần tử gốc (thẻ mở đầu tiên) và thuộc tính còn lại vào phần tử có data-vds-rest
     * (không có thì phần tử gốc). Thuộc tính của tác giả ghi đè thuộc tính của mẫu; class nối thêm.
     */
    private static function applyAttrs($html, array $rest, $cls)
    {
        if (!preg_match_all('~<([a-zA-Z][\w-]*)(' . self::ATTRS . ')\s*(/?)>~', $html, $tags, PREG_SET_ORDER | PREG_OFFSET_CAPTURE)) {
            return $html;
        }
        $target = 0;
        foreach ($tags as $i => $m) {
            foreach (self::parseAttrs($m[2][0]) as $a) {
                if ($a[0] === 'data-vds-rest') {
                    $target = $i;
                    break 2;
                }
            }
        }
        $edits = [];
        $edit = function ($i, array $given) use (&$edits, $tags) {
            $own = isset($edits[$i]) ? $edits[$i] : array_values(array_filter(self::parseAttrs($tags[$i][2][0]), function ($a) {
                return $a[0] !== 'data-vds-rest';
            }));
            $edits[$i] = self::mergeAttrs($own, $given);
        };
        $edit($target, $rest);
        if ($cls !== null && $cls !== '') {
            $edit(0, [['class', $cls]]);
        }
        ksort($edits);
        $out = '';
        $last = 0;
        foreach ($edits as $i => $attrs) {
            $m = $tags[$i];
            $out .= substr($html, $last, $m[0][1] - $last) . '<' . $m[1][0] . self::serializeAttrs($attrs) . ($m[3][0] !== '' ? ' /' : '') . '>';
            $last = $m[0][1] + strlen($m[0][0]);
        }
        return $out . substr($html, $last);
    }

    // ─── Thuộc tính ──────────────────────────────────────────────────────────

    /** Thuộc tính của thẻ, theo thứ tự: [tên, giá trị như viết trong HTML (bỏ ngoặc) hoặc null nếu không có giá trị]. */
    private static function parseAttrs($text)
    {
        preg_match_all('~([^\s"\'=<>/]+)(?:\s*=\s*(' . self::VALUE . '))?~', $text, $found, PREG_SET_ORDER);
        $attrs = [];
        foreach ($found as $m) {
            $value = isset($m[2]) && $m[2] !== '' ? $m[2] : null;
            if ($value !== null && ($value[0] === '"' || $value[0] === "'")) {
                $value = (string) substr($value, 1, -1);
            }
            $attrs[] = [$m[1], $value];
        }
        return $attrs;
    }

    private static function attr(array $attrs, $key)
    {
        foreach ($attrs as $a) {
            if (strtolower($a[0]) === $key) {
                return $a[1];
            }
        }
        return null;
    }

    /** Trùng tên thì ghi đè (giữ vị trí), class nối thêm; tên so không phân biệt hoa thường. */
    private static function mergeAttrs(array $own, array $given)
    {
        $merged = [];
        foreach ($own as $a) {
            $merged[strtolower($a[0])] = $a;
        }
        foreach ($given as $a) {
            $key = strtolower($a[0]);
            $prev = isset($merged[$key]) ? $merged[$key] : null;
            $value = $key === 'class' && $prev !== null && $prev[1] && $a[1] ? $prev[1] . ' ' . $a[1] : $a[1];
            $merged[$key] = [$prev === null ? $a[0] : $prev[0], $value];
        }
        return array_values($merged);
    }

    private static function serializeAttrs(array $attrs)
    {
        $out = '';
        foreach ($attrs as $a) {
            $quote = $a[1] !== null && strpos($a[1], '"') !== false ? "'" : '"';
            $out .= $a[1] === null ? ' ' . $a[0] : ' ' . $a[0] . '=' . $quote . $a[1] . $quote;
        }
        return $out;
    }

    // ─── Icon, logo ──────────────────────────────────────────────────────────

    /** Đổi <i data-vds-icon="X" …></i> (0.3.0) thành <vds-icon name="X" …></vds-icon>; tương tự cho logo. */
    private static function upgradeLegacy($html)
    {
        $out = preg_replace_callback('~<i(' . self::ATTRS . ')\s*(?:/>|>' . self::SPACE . '*</i>)~i', function ($m) {
            $attrs = self::parseAttrs($m[1]);
            foreach ($attrs as $i => $a) {
                if (preg_match('~^data-vds-(icon|logo)$~i', $a[0]) && $a[1] !== null) {
                    $kind = substr(strtolower($a[0]), 9);
                    unset($attrs[$i]);
                    return "<vds-$kind" . self::serializeAttrs(array_merge([['name', $a[1]]], array_values($attrs))) . "></vds-$kind>";
                }
            }
            return $m[0];
        }, $html);
        return $out === null ? $html : $out;
    }

    /** Tên file icon theo cỡ: size thay cỡ ở cuối tên (nếu có) hoặc thêm vào, vd Share__Regular + 20 -> Share__Regular__20. */
    private static function iconName($name, $size)
    {
        return $size !== null && $size !== '' ? preg_replace('~__\d+$~', '', $name) . '__' . $size : $name;
    }

    /**
     * SVG thay cho thẻ icon, logo: thuộc tính của thẻ (trừ name, size) chuyển sang <svg> (class nối thêm), thêm
     * data-vds-icon hoặc data-vds-logo; có aria-label, aria-labelledby hoặc title thì role="img", không có thì
     * aria-hidden="true"; luôn có focusable="false".
     */
    private static function toSvg($file, array $attrs, array $marker)
    {
        if (!preg_match('~<svg(' . self::ATTRS . ')\s*>~i', $file, $start, PREG_OFFSET_CAPTURE)) {
            return null;
        }
        $merged = self::mergeAttrs(self::parseAttrs($start[1][0]), array_merge($attrs, [$marker]));
        $keys = array_map(function ($a) {
            return strtolower($a[0]);
        }, $merged);
        $labelled = count(array_intersect(['aria-label', 'aria-labelledby', 'title'], $keys)) > 0;
        $a11y = $labelled ? ['role', 'img'] : ['aria-hidden', 'true'];
        if (!in_array($a11y[0], $keys, true)) {
            $merged[] = $a11y;
        }
        if (!in_array('focusable', $keys, true)) {
            $merged[] = ['focusable', 'false'];
        }
        $rest = preg_replace('~^' . self::SPACE . '+|' . self::SPACE . '+$~', '', substr($file, $start[0][1] + strlen($start[0][0])));
        return '<svg' . self::serializeAttrs($merged) . '>' . preg_replace('~>' . self::SPACE . '+<~', '><', $rest);
    }

    /** Nội dung file SVG của icon, logo theo tên; mỗi tên chỉ tìm một lần. */
    private function svgOf($kind, $name, $follow = true)
    {
        $key = $kind . ':' . $name;
        if (!array_key_exists($key, $this->svgs)) {
            $this->svgs[$key] = $this->find($kind, $name, $follow);
        }
        return $this->svgs[$key];
    }

    private function find($kind, $name, $follow)
    {
        if (!preg_match('~^[A-Za-z0-9_-]+$~', $name)) {
            error_log("VDS: tên $kind không hợp lệ \"$name\"");
            return null;
        }
        $file = $this->read($kind === 'icon' ? "icons/Icon__$name.svg" : "logos/themeable/$name.svg");
        if ($file !== null) {
            return $file;
        }
        // Icon đã đổi tên: icons/renamed.json ghi tên cũ -> tên mới, giữ ít nhất một phiên bản sau khi đổi.
        if ($kind === 'icon' && $follow) {
            if ($this->renamed === null) {
                $json = $this->read('icons/renamed.json');
                $list = $json === null ? null : json_decode($json, true);
                $this->renamed = is_array($list) ? $list : [];
            }
            if (isset($this->renamed[$name])) {
                $next = (string) $this->renamed[$name];
                error_log("VDS: icon \"$name\" đã đổi tên thành \"$next\", sửa lại tên trong HTML");
                return $this->svgOf($kind, $next, false);
            }
        }
        error_log("VDS: không có $kind \"$name\"");
        return null;
    }

    /** Đọc file trong bộ phát hành (đường dẫn tương đối, vd icons/Icon__Add__Regular__24.svg); không có thì null. */
    private function read($path)
    {
        if (array_key_exists($path, $this->files)) {
            return $this->files[$path];
        }
        $url = $this->source . $path;
        $cache = preg_match('~^https?://~i', $url) && $this->cacheDir ? $this->cacheDir . '/' . md5($url) : null;
        if ($cache !== null && is_file($cache)) {
            $text = file_get_contents($cache);
        } else {
            $text = @file_get_contents($url);
            if ($text !== false && $cache !== null && (is_dir($this->cacheDir) || @mkdir($this->cacheDir, 0775, true))) {
                @file_put_contents($cache, $text, LOCK_EX);
            }
        }
        return $this->files[$path] = $text === false ? null : $text;
    }
}
