本文介绍 Seedream 5.0 lite、4.5 和 4.0 的提示词（prompt）使用技巧，帮助您快速上手图片创作，将创意转化为图片内容。
<span id="e635ff65"></span>
# 通用规则
Seedream 5.0 lite、4.5 和 4.0 支持文生图、图片编辑、参考图生图、组图生成等多样化任务。为了获得更理想的图像创作效果，建议在编写提示词时注意以下几点：

1. **用自然语言清晰描述画面**
   建议用**简洁连贯**的自然语言写明 **主体 + 行为 + 环境**，若对画面美学有要求，可用自然语言或短语补充 **风格**、**色彩**、**光影**、**构图** 等美学元素。
   * 示例：一个穿着华丽服装的女孩，撑着遮阳伞走在林荫道上，莫奈油画风格。
   * 避免：一个女孩，撑伞，林荫街道，油画般的细腻笔触。
2. **明确应用场景和用途**
   当有明确的应用场景时，推荐在文本提示中写明图像用途和类型。
   * 示例：设计一个游戏公司的 logo，主体是一只在用游戏手柄打游戏的狗，logo 上写有公司名 “PITBULL”。
   * 避免：一张抽象图片，狗拿着游戏手柄，狗狗上写 PITBULL。
3. **提升风格渲染效果**
   如果有明确的风格需求，使用精准的 **风格词** 或提供 **参考图像**，能获得更理想的效果。


示例

* 绘本：

<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/66f0a49a642c4afb8ed626a80315ce6b~tplv-goo7wpa0wc-image.image =200x) </span>

* 儿童绘本：

<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/a0fbf4ea3eaf4ec78c9969223fde10f2~tplv-goo7wpa0wc-image.image =200x) </span>

* 风格参考图：

<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/835e5c45884d46c9b3563f277af98e0f~tplv-goo7wpa0wc-image.image =250x) </span>


&nbsp;
4. **提高文本渲染准确度**
   建议将要生成的 **文字内容** 放在 **双引号** 中。
   * 示例：生成一张海报，标题为 “Seedream 4.5”
   * 避免：生成一张海报，标题为 Seedream 4.5
5. **明确图片编辑目标和希望保持不变的部分**
   使用 **简洁明确的指令**，说明需要修改或参考的对象及具体操作，避免使用指代模糊的代词；如果希望除了修改的内容都保持不变，则可以在 prompt 中强调。
   * 示例：让图中最高的那只熊猫穿上粉色的京剧服饰并戴上头饰，并保持动作不变。
   * 避免：让它穿上粉色衣服。

<span id="cac2f815"></span>
# 提示词秘籍
<span id="69ac6946"></span>
## 文生图
采用清晰明确的自然语言描述画面内容，对于细节比较丰富的图像，可通过详细的文本描述精准控制画面细节。
> 相较旧版本 Seedream 3.0，Seedream 5.0 lite、4.5 和 4.0 对文本提示的理解能力更强，能够在较少描述的情况下生成符合预期的画面，且**画面不再泛白**，因此在使用该模型时采用简洁精确的提示通常优于重复堆叠华丽复杂的词汇。


<span aceTableMode="list" aceTableWidth="6,3"></span>
|输入 |输出 |
|---|---|
| **【prompt】** 一个凌乱的办公桌桌面。桌面上有一台开着的笔记本电脑，屏幕显示绿色代码；旁边一个马克杯，杯上写着“Developer”，杯口冒出热气；一本摊开的书，页面是维恩图，展示三个圆的嵌套关系，三个圆分别为灰色、蓝色和浅绿色；一个便签贴，上面画着一个思维导图，思维导图是上下结构，分为3层结构；一支钢笔，笔帽掉在旁边；钢笔旁边是一个手机，屏幕显示一条新消息通知，桌子角落是一小盆多肉植物。背景是模糊的书架。阳光从右侧照射，在桌上形成光影。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/216793277320424a90a06ee992ebd9ff~tplv-goo7wpa0wc-image.image =200x) </span> |
| **【prompt】** 冰箱打开的内部视图：上层: 左边放着一盒牛奶，牛奶盒上绘制了三只大小不一的奶牛，在草原上吃草，右边是一个鸡蛋支架，里面放着八个鸡蛋。中层: 一个盘子，里面装着吃剩的烤鸡，烤鸡上插着一个红色的小旗帜，旁边是一个装满草莓的透明保鲜盒，盒子上绘制有菠萝、草莓和橙子的图案。 下层: 蔬菜抽屉里有生菜、胡萝卜和西红柿。冰箱门后面的置物架里放着番茄酱和蛋黄酱。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/b0ecb3ea9c644cbfa6bc3ecffcdd1ae7~tplv-goo7wpa0wc-image.image =200x) </span> |

Seedream 5.0 lite、4.5 和 4.0 可将知识与推理结果转化为高密度图像内容，如公式、图表、教学插图等。在生成时应明确使用**专业术语**，确保知识点表达准确，并写清对生成图像的具体要求，如可视化形式、版式、风格等。

<span aceTableMode="list" aceTableWidth="6,3"></span>
|输入 |输出 |
|---|---|
| **【prompt】** 在黑板上画出下列二元一次方程组及其相应的解法步骤：5x + 2y = 26；2x \- y = 5。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/5542418531b54f068073d9ea7e2cf206~tplv-goo7wpa0wc-image.image =200x) </span> |
| **【prompt】** 绘制一张信息图，展示通货膨胀的成因，每条成因独立呈现，并配有简洁图标。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/1fd2da22c89f4f528a1f0a505ef01e27~tplv-goo7wpa0wc-image.image =200x) </span> |

<span id="03696e91"></span>
## 图生图
Seedream 5.0 lite、4.5 和 4.0 支持结合文本与图片完成图像编辑和参考生成任务，并可通过**箭头**、**线框**、**涂鸦等视觉信号**控制画面区域，实现可控生成。
<span id="beece9a1"></span>
### 图像编辑
Seedream 5.0 lite、4.5 和 4.0 支持通过文本提示对画面进行**增加**、**删除**、**替换**、**修改**等编辑操作。
建议使用**简洁明确**的文字，**准确指示需要编辑的对象与变化要求**。

<span aceTableMode="list" aceTableWidth="1,3,3"></span>
|场景 |输入 |输出 |
|---|---|---|
|增加 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/e08a8aa144d441e5932e15717a644eae~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/5affde557c944cabb0e0a35bf011ae24~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 给图中女生**增加相同款式的银色耳线和项链。**  | |
|删除 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/32abecfd1fd84e56b2e95379946783ab~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/96253cbc5d6942ce9c7cb4a5b55c2250~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：去掉**女生的**帽子。**  | |
|替换 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9652ed8ee1084b939a9fc39850224b9a~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/1281cd9f97154b25bc1266ddf7b1f366~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 把最大的面包人**换成牛角包形象**，保持动作和表情不变。 | |
|修改 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/17345381bde048f1b03c85f06ced3b7a~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/8cbeeaece36940d0b395311526267432~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 让图中三个机器人**变成透明水晶材质**，颜色从左到右分别变成红黄绿。并让绿色的机器人跑起来，黄色的走路，红色的站立。 | |

**当画面内容比较复杂，难以通过文本准确描述编辑对象时，可采用箭头、线框、涂鸦等方式指明编辑对象和位置。** 

<span aceTableMode="list" aceTableWidth="1,3,3"></span>
|场景 |输入 |输出 |
|---|---|---|
|涂鸦 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/1da20e56baf64f2e94992b3eaa157cbb~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/d08146660f894b0db00d3696b73a3d26~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 将房间内**红色涂抹位置**放入电视，**蓝色涂抹位置**放入沙发，不改变其他布局，确保放入物体和整张图的原木风格一致。 | |
|线框 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/69b235500bdd47fe8abf3505c4d3a2cb~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/7ff2ba9212934e06af93e54c7f92b02c~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 放大图中的标题**至红框大小**，并改成和萨克斯图案一样的颜色和字体风格。 | |

<span id="637494e3"></span>
### 参考图生图
Seedream 5.0 lite、4.5 和 4.0 支持从参考图像中提取关键信息，如：人物形象、艺术风格、产品特征，完成角色创作、风格迁移与产品设计等任务。
当有明确需保持的特征（如角色形象、视觉风格、产品设计）时，可上传图像作为参考，以确保生成结果与期望保持一致。只需在文本提示中明确两部分内容：

* **指明参考对象**：清晰描述希望从参考图中提取并保留的元素，如：参考图中的人物形象、参考图中产品材质等。
* **描述生成画面**：具体说明希望生成的画面内容、场景等细节信息。


<span aceTableMode="list" aceTableWidth="1,3,3"></span>
|输入 |输入 |输出 |
|---|---|---|
|参考人物形象 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/831a5653f6d04c0e98e59ecf7ec53533~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/24c2dd7e60b9466ca9878efdade45bcd~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：参考图中的人物形象**，做一个动漫人物手办，放在桌上，后面放置一个印有角色图像的生日礼物包装盒，盒子下面有一本书，在包装盒前面，添加一个圆形塑料底座，角色手办站在上面，将场景设置在室内，尽可能真实；生成尺寸和现在图一样；手办在图片的左边；整个图片的风格和原始图一样，大片摄影感。 | |
|参考风格 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/134e11b52a344f69b95384366580a7df~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/aea5b230eb4c4bb0980c0c143303f6a5~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：参考图标的线性简约风格**，设计9个不同场景下的应用 icon，包括：音乐、天气、日历、相机、聊天、地图、闹钟、购物车、笔记本，保持一致的配色。 | |
|参考虚拟实体形象 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/ab24058e799f47148b25bf1d1e170132~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9eed566012d14b7abe5abed039a06fe9~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：图中的形象变成一个羊毛毡**，下面有个小支架使得它仍然维持这个姿势，放在一个深色的书桌上。 | |
|参考款式 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f6beba8c063f4c718c9e7b443907019d~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/74d10ac9223d4fa0b3dc121fcb44deec~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 生成四件不同材质和颜色的上衣，**衣服款式与图中女生身上的衣服一致**，只要衣服，不要模特。 | |

当需要根据设计草图（如平面图、线稿图、手绘原型）生成高保真效果图时，建议遵循如下指引：

1. **提供清晰的原始图片**，若图中有文字说明，则在文本提示中注明“遵循图中文字内容进行生成”。
2. **明确主体与要求**，如高保真 UI 界面、现代简约风格客厅实景图。
3. **明确指出需与参考图保持一致的关键要求**，如家具位置与参考图一致、按照原型图的布局等。


<span aceTableMode="list" aceTableWidth="1,3,3"></span>
|场景 |输入 |输出 |
|---|---|---|
|平面图 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/40ee854a670a4e8790512881500a10b2~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/3c29067cac8e419c9c9360e30a1f2bea~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt： 根据这张平面图**，生成 “现代简约风精装客厅 + 开放式餐厅”的实景图（房间布局、家具位置完全匹配例图）。地中海风格配色，空间结构和方向始终与例图一致。房间立体开阔（餐桌那边是阳光挑高），由近及远分别是沙发&绿植、电视、餐桌&椅子、落地窗（不需要体现文字和手绘边缘）。 | |
|手绘原型 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/ddf2d38a48064f5589bd116591dcc021~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/46ab4bc54f7140c484044df24bc56c69~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 这是一个 Web 端房屋租赁软件的详情页手绘图，**请根据图中文字示意**，将其**渲染成高保真的 UI 界面**，并在画廊区域增加一些示例图片，在房屋信息和预定信息区域增加一些示例的文字信息。 | |

<span id="803573ae"></span>
## 多图输入
Seedream 5.0 lite、4.5 和 4.0 支持同时输入多张图像，完成**替换**、**组合**、**迁移**等复合编辑操作。使用该功能时，建议在文本提示中清楚指明不同图像需要编辑/参考的对象及操作，如：用**图一的人物**替换**图二的人物**，并参考**图三的风格**进行生成。

<span aceTableMode="list" aceTableWidth="1,3,3"></span>
|场景 |输入 |输出 |
|---|---|---|
|替换 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/c4bdff18908040b7a0d3248b20700825~tplv-goo7wpa0wc-image.image =300x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/53a9e700c7364fbfb9676bbbc536bd11~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 将**图一的主体**替换为**图二的主体。**  | |
|组合 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/54b6a31586be475fb22d79bb34f4f132~tplv-goo7wpa0wc-image.image =300x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/b2be95beccef461f904747381ca3de99~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 让**图一人物**穿上**图二的服装。**  | |
|迁移 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/e97caaa8aa2047ae9e8a797b13be5c2b~tplv-goo7wpa0wc-image.image =300x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/b38d0b74cfd642938ae43b20d4ef0497~tplv-goo7wpa0wc-image.image =200x) </span> |\
| |> **prompt：** 参考**图二的风格**，对图一进行风格转换。 | |

<span id="12a6476e"></span>
## 多图输出
Seedream 5.0 lite、4.5 和 4.0 支持生成角色连贯、风格统一的图像序列，适用于分镜、漫画创作，以及需要统一视觉风格的成套设计场景，如 IP 产品或表情包制作。
当有多图生成需求时，可以通过“一系列”、“一套”、“组图”等提示词触发模型生成组图，或采用具体数字表明图片数量。

<span aceTableMode="list" aceTableWidth="3,3"></span>
|输入 |输出 |
|---|---|
|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/e4d6939a73f64cafb9bef358ee0b6452~tplv-goo7wpa0wc-image.image =200x) </span>|<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/5eddf0309b704151824b8d285b3fe8d1~tplv-goo7wpa0wc-image.image =350x) </span> |\
|>  **【prompt】** 参考这个 LOGO，做一套户外运动品牌视觉设计，品牌名称为“GREEN”，包括包装袋、帽子、卡片、手环、纸盒、挂绳等。绿色视觉主色调，简约现代风格。 | |
| **【prompt】** 生成四张图，影视分镜，分别对应：宇航员在空间站维修飞船、突然遇到陨石带袭击、宇航员紧急躲避、受伤后惊险逃回飞船。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0534bec7063348b393d732034fd64879~tplv-goo7wpa0wc-image.image =350x) </span> |
| **【prompt】** 生成周一到周日共七张手机壁纸图，自然景观，每张图对应标注日期。 |<span>![图片](https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f566a3c2dec0465a8d6d12d7fc269e35~tplv-goo7wpa0wc-image.image =350x) </span> |



