本文介绍 Seedance\-1.5\-pro 的提示词使用方法和相关技巧，帮助您更高效地利用该模型生成符合需求的优质视频作品。
<span id="6d5947f4"></span>
## 模型简介
**Seedance 1.5 Pro** 是一款**原生支持音频与视频联合生成**的专业级视频生成模型，面向“音画同步”的创作需求。模型采用双分支 Diffusion Transformer 架构，通过跨模态联合模块统一建模画面、语音与节奏，使生成的视频在口型、情绪与声音节奏上保持高度一致。
<span id="f9d07067"></span>
## 模型优势

1. **音画高精同步**：高保真音画声一体输出，支持环境音、动作音、合成音、乐器音、背景音乐及人声等
2. **多人多语言对白**：支持独白与多人对话，口型毫秒级精准对齐，并覆盖中文、方言、英文及小语种，全方位还原真实自然的对话质感
3. **影视级叙事张力：** 运动幅度自然、节奏感强，精准捕捉动作细节；画面感知力强，人物情绪与表情呈现细腻，大幅提升生动性，实现影视级创作质感

<span id="c330edad"></span>
## 提示词参数
[创建视频生成任务 API ](https://www.volcengine.com/docs/82379/1520757)中，跟提示词有关的参数如下：

1. **提示词（必填）** ：支持中英文。
2. **参数（选填）** ：支持通过 **resolution、ratio、duration、seed、camera_fixed、watermark** 等参数控制视频输出的规格。支持以下两种输入方式。
   * 新方式（推荐）：在 request body 中直接传入。

```JSON
...
   // Strongly recommended
   // Specify the aspect ratio of the generated video as 16:9, duration as 5 seconds, resolution as 720p, seed as 11, and include a watermark. The camera is not fixed.
    "model": "doubao-seedance-1-5-pro-251215",
    "content": [
        {
            "type": "text",
            "text": "小猫对着镜头打哈欠"
        }
    ],
    // All parameters must be written in full; abbreviations are not supported
    "resolution": "720p",
    "ratio":"16:9",
    "duration": 5,
    // "frames": 29, Either duration or frames is required
    "seed": 11,
    "camera_fixed": false,
    "watermark": true
...
```


* 旧方式：在文本提示词后追加 \-\-[parameters]

```JSON
...
// Specify the aspect ratio of the generated video as 16:9, duration as 5 seconds, resolution as 720p, seed as 11, and include a watermark. The camera is not fixed.
"content": [
        {
            "type": "text",
            "text": "小猫对着镜头打哈欠 --rs 720p --rt 16:9 --dur 5 --seed 11 --cf false --wm true"
            // "text": "小猫对着镜头打哈欠 --resolution 720p --ratio 16:9 --duration 5 --seed 11 --camerafixed false --watermark true"
        }
 ]
 ...
```

<span id="14e86459"></span>
## 通用技巧
**提示词公式：主体+运动+环境（非必须）+运镜/切镜（非必须）+美学描述（非必须）+声音（非必须）** 
> 通过描述**对白内容、语言类型、情绪变化、镜头运动与叙事结构**等内容，可以让模型生成的音频与画面更加贴合，满足专业创作场景对音画一致性的高要求。

<span id="dcfdb432"></span>
### 基础原则

1. **描述必要的信息**


<span aceTableMode="list" aceTableWidth="3,3,2"></span>
|给出主体、运动的限定描述 |给出画面应体现的直观信息 |善用程度副词 |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/55bf2e84a43740b798c38075f04d558b~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/70ed5b7c90ed48aba4bf4fc1956d1ab6~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/22262f035fc6437d8f2814222872a103~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 一个**面容沧桑、身穿中世纪海盗服饰的男子**站在**大海边黑色的礁石上。男子的表情富有激情**，他向天空**有力的举起双手**，动作透露出对自由的渴望。 |> 狂风暴雨中，海面上卷起**巨大的海浪**。海水冲进城市，**撞毁岸边的房屋。** 数以百计的市民**惊恐地逃跑**。最终海啸淹没一切 |> 玩偶先是**缓慢旋转**，随后她**停止转动**，面对镜头展现自己的可爱。 |


2. **描述清晰的信息**


<span aceTableMode="list" aceTableWidth="4,7"></span>
|prompt与画面、音频形成正确对应 |用特征指定主体，指定方式全程一致 |
|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9dabdb62fbec4d5f8bc4af21384632fa~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/a0552d8a830f4bd1b07a840f0b352b2f~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 模特展示身上的旗袍，气质优雅，旗袍魅力十足。 |> 赛车比赛的拍摄现场，画面中的从左到右按顺序是赛车手、导演、摄影师。**画面最左边赛车服形象的人是赛车手、中间中国青年形象的人是导演、最右边黑人手上抱着摄影机形象的人是摄影师。** 全景拍摄**黑人摄影师看向导演**，他带着疑惑**用英语说：“We got it?”** 。镜头缓慢推近，偏向到导演与赛车手（中景），拍摄时带着轻微手持的呼吸感。**赛车手自信地用法语说：“Perfecto”** ，他说话时露出自豪的笑容。导演听到赛车手的话，导演点了点头，把比着ok手势的手放下。然后**导演用四川话满意说：“有了有了，这条过”。**  |


3. **做精准的切镜描述**


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|明确区分每个镜头，告诉模型确切的切镜信息 |精准撰写切镜的时机 |切镜之间有明确的景别/内容区分 |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/a7d31c5715c94be7903a5e2873a9ee02~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/89fdbc2acbdd458596427ca4227c600e~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/3e1b58d043214ef9a894ba0002971046~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 第一镜头为侧面中景，男生看向窗外。 男生开口说：「大丈夫だと思ってた……」 随后切镜至第二镜头，第二镜头为男生面部特写 第二镜头中，他说：「でも、たぶん自分に嘘ついてただけだ。」。 |> 镜头从三人同框的中景开始，中间黑人男子开口说道：“We need to clear this up.” 接着切镜至第二镜头，第二镜头为左侧女子近景，冷静回应：“I’ve already made my choice.” 接着切镜至第三镜头，第三镜头为白人男子近景，轻轻呼出一口气，说：“The problem is, your choice affects all of us.” 最后镜头切回三人同框的中景，气氛明显变得紧张。 |> 镜头1 正面中景。普通卧室内，夜晚，窗外城市微光透进来。成年男子正对镜头站在床边，穿着普通T恤与牛仔裤，环境非常日常、安静。男子皱眉看向自己的双手，空气中开始出现细微的能量粒子，房间灯光轻微闪烁一次。 镜头2 切镜到手部特写。蓝白色能量迅速包裹双手，像液态金属与光能混合，从指尖向手臂流动。 镜头3 切镜男子面部特写。能量沿着颈部与下颌攀升，皮肤表面浮现出清晰的英雄装甲纹路，眼睛亮起冷白色光。 镜头4 切镜到正面中远景。能量在全身爆发，衣物被光能吞没并重构，完整的超级英雄战衣在身体表面快速成型：金属质感装甲、流线型设计、胸口能量徽章清晰点亮。他说道： “Guess there’s no going back.” |

<span id="3f55c59a"></span>
### 声音生成
<span id="6270f91d"></span>
#### **对话/画外音（Voice）** 

1. **详细描述音色特征固定音色**
> 描述公式：性别+年龄区间+声音属性+语速+情绪基线


<span aceTableMode="list" aceTableWidth="1,1"></span>
|单人场景 |对话场景 |
|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/56110a899d9f4d7eb0b842953917b508~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/fcf9a9fa74bc4c878d3bef306d3da4ba~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 一名女性，年龄区间约为 18–22 岁。声音音域偏高但不尖锐，发声轻快，气声比例适中，音色明亮而有弹性。语速中等偏快，语调起伏明显。情绪基线积极、外向，带有轻微兴奋感和青春活力。说中文普通话。她说：“如果有变动，记得第一时间跟我说一声。” |> 两人正在办公区域中面对面交谈，整体氛围轻松，画面保持稳定无切镜。第一位男性开口时，他的声音属性为中音域，音色自然、不刻意用力，语速中等偏快，情绪基线随意、略带关心，他说道：“你现在主要卡在哪一块？” 另一位男性回应时，他的声音属性为中音域偏低，发声稳重，语速中等，情绪基线平和、配合，他说道：“核心部分已经处理好了，就是细节还要再对一遍。” |


2. **支持响应多语言多方言**
> 中文支持：普通话、陕西话、四川话、粤语等方言
> 外语支持：英语、日语、韩语、西班牙语、印尼语等语言


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|**粤语** |**四川话** |**台湾腔** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/660d427a15834fc58564e9d20e1a53fa~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/d7fae7e2a94948779b15919a41689103~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9ad99b2fab67493181c0efbdb01323aa~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 他用粤语说：“你好靓呀！，我好中意你呀！” |> 酷暑夏日，四川一个老小区树荫下，两名中年男子坐在小板凳上扇扇子，一个穿白背心，一个穿灰背心，旁边停着电瓶车。镜头固定，中景构图，节奏缓慢。 白背心男子说：「这天气热得遭不住哦。」 灰背心男子说：「忍一哈嘛，等会儿就凉快咯。」 |> 傍晚，台湾某大学校园的草坪上，两名学生坐在地上看着远处，一位穿白色衬衫的男生，一位穿灰色衬衫的女生，书包放在一旁。镜头固定，中远景，气氛轻松。 台湾腔对白： 白色衬衫的男生说：「这堂课真的很难耶。」 灰色衬衫的女生说：「对啊，不过老师人还不错啦。」 |
|**印尼语** |**西班牙语** |**英语** |
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/434a5353c0204f6ead536e6508d75416~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/77a1c21484f04d5da5da8c84ddcb994c~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/99cb5fb87b044038914881f50eb6f93f~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 海边木栈道上，三个印尼朋友围坐在一起，两个女孩子和一个男孩子，夕阳在海面上泛起金色光点。镜头从低角度推向三人，捕捉他们的笑声与肢体互动，风格温暖治愈。 三人以印尼语聊天： 其中一个女孩说：「Hari ini indah sekali, ya?」 另外一个女孩说：「Iya, seperti mimpi.」 男孩说：「Dan kita di sini bersama. Itu yang paling penting.」 |> 雨夜，昏暗破旧的地下停车场。两人在承重柱的阴影下快速会面。穿风衣的男子将一个密封的文件袋递出，表情警惕，目光扫视着周围风衣男压低声线，语速极快: “La cosa está dentro. La contraseña es la fecha de nacimiento de tu madre.”女子接过，回应: “Entendido. El próximo punto de contacto ha cambiado. Espera la señal segura.” |> 办公室茶水间里，气氛轻松中带点诙谐，一名中年印度男子和一名年轻的日本男同事站在咖啡机旁。日本男子语气平和地问：“What materials will be prepared for this afternoon's project?” 印度男子立刻用带着明显口音、语速很快的语气回道：“Why did you only ask? Where is the competing product analysis report that the client wants? Hurry up and get it, it's due at two o'clock!” 日本男子有些慌乱又无奈地小声回答：“I'll go right away, I've been editing the PPT just now...”随后他点点头，从画面一侧离开。 |


3. **对话场景下，支持口型匹配角色**
> 提示词需要精准定位不同角色的个性化特征（性别/年龄/穿着/动作）


<span aceTableMode="list" aceTableWidth="1,1"></span>
|**双人对话** |**多人对话** |
|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/d7589dc317db45a8aaa7f3e77dfcf560~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/d4171f0c20074185adda7d58da348e14~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 学徒迟疑地问：“师傅，这里…角度再大一点会不会更牢固？”老师傅轻轻摇了摇头，用粗糙的手指抚摸过木纹，慢条斯理地说：“不不不，孩子，过刚易折。你看这木头的性子，得顺着它来。”他的声音平稳而充满智慧。 |> 托腮思考的男生大声叹气：“已经四十分钟了。”举着手的女孩一边继续找服务员一边嘀咕：“我发誓他们忘了我们的单。”拿着水壶的男生吧一边倒水一边平静地说：“没事，今天是周六晚上。”玩手机的女孩从手机上抬起头开玩笑：“照这个速度，这将是早餐了。” |


4. **支持响应画外音**
> Seedance 1.5 pro 支持控制画外音的音色、情绪、语调、语速


<span aceTableMode="list" aceTableWidth="1,1"></span>
|纪录片 |广告 |
|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/df9c66f6a0f0442c9268b40d3cfb5499~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/05c4524ff91e46268c139436e4a024ec~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 生成带有画外音的视频：一个深沉、平静的男声说：“在宇宙浩瀚的寂静中，我们的世界不过是一个短暂的瞬间。然而，在其中，生命不顾一切地繁荣。”场景应从夜晚缓慢过渡到黎明，星星逐渐消失，太阳从山后升起。 |> 基于输入的口红产品首帧图像生成视频，保持口红与人物外观、比例和材质真实一致，不新增无关元素，整体风格为高端电商美妆广告，画面干净、精致、具有高级感。视频由三个连续分镜组成：第一个分镜中，镜头进行极其缓慢、平稳的前推，展示口红整体外观与设计细节，膏体色泽饱满，光线为柔和稳定的漫射暖光，背景保持干净虚化；第二个分镜切换为模特脸部特写，模特手持口红靠近面部，与镜头形成合影式构图，肤色自然通透，表情从容自信，画面居中稳定，突出人与产品的关联感；第三个分镜切换至女性桌面上的口红特写，口红静置在干净的台面上，周围环境简洁克制，光线柔和细腻，镜头保持稳定，强化产品质感与最终记忆点。画外音为清晰、自信、具有高级感的女性商业配音，语速适中、语调优雅克制，与画面节奏同步，画外音内容为：“Rich color. Smooth texture. One swipe delivers radiant lips. Lightweight, comfortable, and effortlessly elegant.” |

<span id="fce2d036"></span>
#### 音效（SFX）
> Seedance 1.5 pro 支持响应基础音效达到音画直出


<span aceTableMode="list" aceTableWidth="1,1"></span>
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/1f63bfdbec8749f794772f4fc801d231~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/7f9f395e69bb4e4bb4867192be7a99fe~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 生成一段视频，展现窗外的雨势稍稍变大，雨滴在玻璃上汇成股流下，一位打伞的行人匆匆走过窗外的过程。 |> 黄昏时分，大型燃料库爆炸，火球冲天。 |
|---|---|

<span id="5c862f62"></span>
#### 背景音乐（BGM）
> Seedance 1.5 pro 默认生成与提示词适配的背景音乐


<span aceTableMode="list" aceTableWidth="4,5,3"></span>
|控制音乐风格 |通过prompt把握节奏 |控制背景音乐情绪 |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f48d949474a5469abae16174c9cf127e~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/62ce5702048b497da7e5797a02c9a12b~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/8bbdd5cc48e14926b6a95a8eff649361~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 一段宏伟的史诗航拍视频，镜头穿越云雾缭绕的壮丽山脉和古老城堡，背景音乐是震撼人心的交响乐，充满力量与希望的主题旋律。 |> 一个卡通人物在屏幕中央。背景音乐是一首节奏明快的流行歌曲片段。要求这个卡通人物随着音乐的鼓点鼓掌。 |> 手指轻柔地拂过照片中每个人的脸庞。背景音乐需要是温情、怀旧、旋律优美的吉他或钢琴独奏，音乐应带有淡淡的追忆与幸福交织的复杂情感，温暖中透出一丝时光流逝的轻柔感伤 |

<span id="d9432153"></span>
### **切镜撰写**

1. **支持切镜前后风格一致**


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|**迪士尼风格动漫** |**皮克斯风格** |**写实** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/dfeb79d6fc30470cb45c482082d460f9~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/da884b087ab1499eb822bd143cc0d795~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/413515e97d1540e1959a255fd54c807d~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 镜头从两人同框的中景开始，女孩转头看着男孩，自信地笑着说：“我们一定能做到！”切镜到男孩的近景，他犹豫地回答：“你确定吗？”镜头切回女孩的中近景，她转身张开双臂，语气轻快地说：“当然！因为我们已经走到这一步了。”镜头随着她的动作自然停住，情绪明亮而坚定。 |> 镜头从父子二人的中景开始，男孩低着头低声说：“我是不是让你失望了？” 之后切换至第二个镜头，第二个镜头是父亲的近景，他短暂沉默后轻声回答：“不。” 接着切换至第三个镜头，第三个镜头男孩的特写，他抬起头。 最后镜头切回父亲，他微笑着说：“我只是担心你会先对自己失望。” |> 镜头从猫粮碗的近景开始。之后切镜到第二个镜头，第二个镜头是猫的正面特写，它没有立刻靠近，而是安静地看着。 接着镜头切到第三个镜头，第三个镜头是主人的中近景，她低声说：“这次换了新的。” 接着镜头切至第四个镜头，回到猫的侧面近景，它慢慢走近，低头嗅闻，它终于开始进食。 最后切到主人的近景，她轻声说：“看来合你胃口。”最后切镜到猫与猫粮同框的稳定画面，节奏放缓。 |


2. **支持对话场景下的正反打镜头分镜**


<span aceTableMode="list" aceTableWidth="1,1"></span>
|**双人** |**三人** |
|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/c153f6e13faf453492de95be68f6092a~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/bc7769dc55b3487ebc9a84077de1fb73~tplv-goo7wpa0wc-image.image" controls></video>|\
|||\
|> 镜头从侦探的中近景开始，他语气平稳地说：“你在十一点四十七分回到那条巷子，这不是巧合。”切镜到嫌疑人的近景，他轻轻冷笑，视线偏开，说：“巧合这种东西，事后看起来总是很有计划。”镜头切回侦探的更近特写，他的表情明显变冷，却保持沉默，空气中的紧张感随着切镜不断加重。 |> 镜头从三人同框中景开始。矮个子的男性看了一眼手表，说：“It’s about time.”之后切镜至第二个镜头，是中间女孩的中近景，她皱了下眉，回应：“Let’s wait a little longer. They might arrive any minute.” 之后镜头切到第三个镜头，是高个男人的近景，他望向街道尽头，语气平静却带着不耐：“We’ve been waiting for a long time.” 最后切镜回三人同框的中景，三人的视线短暂交错，没有人再说话，气氛尴尬 |


3. **支持响应切镜时机**


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|**特效变身** |**影视** |**动漫** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0a8fff692f124c8ca1ed2f5d81d28cac~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/db3909e4ef894cc4a4dd5513db58de50~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9d94325685ea42d2a240b94e7f59e633~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 镜头1：中景，人物抬起手看向自己的手掌。 镜头2：切镜到手部特写，手掌周围开始出现微弱的发光粒子，缓慢漂浮。 镜头3：切镜到人物脖子特写，光粒向上蔓延 镜头4：切镜到人物的中景，人物头上随着光粒蔓延出现一个发着金色光芒的圣诞帽 镜头5：切镜到人物面部特写，她说：“Merry Christmas”，戴着圣诞帽满意地微笑 |> 镜头从室内的远中景开始，傍晚的自然光透过窗户洒进来，一名成年男子独自站在窗前，手里拿着手机。 切镜到中景，他低头看了一眼手机屏幕，屏幕的光映在他的脸上。 切镜到他的手部近景，手指在屏幕上停顿，没有按下发送键。 镜头切到他的侧脸近景，他轻轻呼出一口气，低声说道：“I think I’ll skip it.” 最后切镜回到远中景，他把手机放进口袋，转身离开窗边，房间重新安静下来，画面停住。 |> 镜头一：镜头从屋顶的远中景开始，两人同框站在霓虹灯映照下的城市上方。 男性角色说：“This city eats people alive.” 镜头二：切镜到女性角色近景，她冷笑一声，回答：“Only if you let it.” 镜头三：镜头切回男性角色的近景，他转头看向对方，语气变得低沉：“You really think we can change it?” 镜头四：切镜到女性角色的中近景，她向前一步，霓虹光在脸上跳动，坚定地说：“No. But we can survive it.” 镜头五：最后切镜回两人同框的中景 |

<span id="70433615"></span>
## 进阶技巧
<span id="46df0ecc"></span>
### **指定参考风格提升美感**
> 通过指定美学参考对象，可以生成风格鲜明、音画和谐的视频时，除了修辞和描述，通过指定美学参考对象也可能是有效的手段


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|日剧《小森林》风格 |宫崎骏动漫风格 |迪士尼动漫风格 |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0e29d374075c4c99a05c949a09967756~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/b29492b1b29a48e4951cafb7d9fcbf55~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/5f5d30ca24714091849c9818d025c5f9~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 模仿日剧《小森林》的风格，生成一个女孩在果园中采摘苹果视频。女孩头戴粉色格子头巾，长相甜美，背着帆布小包。她从树上摘下一个苹果，认真擦拭干净后品尝苹果。 |> 模仿宫崎骏动漫的风格，生成一个女孩在果园中采摘苹果视频。女孩头戴粉色格子头巾，长相甜美，背着帆布小包。她从树上摘下一个苹果，认真擦拭干净后品尝苹果。 |> 参考迪士尼2D动漫电影的风格，生成一个女孩在果园中采摘苹果视频。女孩头戴粉色格子头巾，长相甜美，背着帆布小包。她从树上摘下一个苹果，认真擦拭干净后品尝苹果。 |

<span id="1fef86bc"></span>
### **用摄影术语提升镜头效果**
> 正确使用摄影术语，能够提升镜头运动的质量，提升视频观感

1. **视角**
* 摄影机角度：高机位/低机位/俯视/仰视/平视/正扣/正仰等


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|**高机位视角** |**平机位视角** |**低机位视角** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/37ce1a0bb4164764916457f14a664ff2~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/ed03a3e885f24122a4df9a0ca2fcfbb7~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/19fea3bcda8340c993e293237f4fc981~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 高机位俯视静谧的森林空镜，秋风卷着银杏叶掠过青石板，镜头缓推聚焦落叶堆中半露的青铜钥匙。 |> 平机位中景跟拍滑板少年，45mm广角镜头与他肩齐平，前轮碾过积水时水花横向甩过画面。 |> 大雨中流浪汉抱紧自己的膝盖蜷缩在一个消防梯的下面。低机位从流浪汉的膝盖间仰拍流浪汉表情，流浪汉的脸广角畸变里放大，随着一声惊雷流浪汉吓得抬起头看向天空，同时镜头随流浪汉动作也上摇至漆黑落雨的天空。 |


* 叙事视角：过肩视角/xx的主观视角/监控视角/望远镜视角/蝼蚁视角/偷窥视角等


<span aceTableMode="list" aceTableWidth="4,4,3"></span>
|**过肩视角** |**望远镜视角** |**监控鱼眼视角** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/09644ecd00c7447d974d451f642598ba~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/b66999aa9de243d9b2265183e018d935~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/daff20683f88478aa457e5d8078784e1~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 镜头从角色A肩后视角拍摄，聚焦于对面角色B的面部表情。两人在咖啡馆窗边对话，B手中咖啡杯缓缓放下。镜头随着B的肢体语言微幅推进，背景虚化中可见窗外行人走动。光线从侧面窗户洒入，在A肩部形成轮廓光。 |> 望远镜看到桥对面迎面走来一个穿着黑色斗篷的吟游诗人，先注意到他的脸上有一道深深的伤疤贯穿了眼睛和左脸颊，他的脖子上挂着一枚太阳图腾的陶制挂件，他的腰间别着一个使用痕迹很明显的水壶，再看到他的靴子，上面有大量灰尘和划痕，像是走了很远的路。再看向他身后的马，马的眼睛深邃又充满睿智。 |> 固定鱼眼监控镜头。画面中心是一个人在封闭房间内焦虑徘徊，他的身影在中心区域相对正常。而房间的四面墙壁、天花板和地板在鱼眼效应下，向中心挤压、弯曲，仿佛整个空间都在向他坍塌。 |


* 主体角度：正面/正侧/四分之三侧/背面/顶面/底面等


<span aceTableMode="list" aceTableWidth="1,1,1"></span>
|**侧面视角** |**背面视角** |**正面视角** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/f41e04e06c8b42e791cdbc3b2dd65e99~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/05bc77275a934e9dbd003f327fa95a75~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/3f3aced243a541c5acb5d615310a28b0~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 年轻女性拉开窗帘，被条纹布艺厚窗帘几乎完全遮挡住的落地窗，有很多绿植，画廊室内昏暗冷色调，窗口侧面特写，小景深。窗帘的缝隙能看到窗外是上午的阳光，丁达尔光。 |> 一位穿白色长风衣、披肩短发、站姿端正的女子 站在城市天台边缘，俯瞰夜景，背对镜头。 镜头从她近景背影开始，逐渐向后拉远，让更多天台与城市灯光进入画面。 要求镜头后拉平稳、光线不过曝，女子风衣摆随环境微风轻动但姿势不变。 |> 一名黑发微卷、三十五岁左右的男子 站在街头霓虹灯前，正面直视镜头。 他穿着 及膝黑色风衣、深灰高领毛衣、带金属扣的皮手套，表情冷静且带压迫感。 城市夜色中霓虹反光映在他的脸部轮廓上。 镜头以正面视角 从中景缓慢推近为特写，要求运动平滑、构图稳定、光线无波动，人物胸腔自然起伏。 |


2. **景别**
> 使用景别词时的规范语法：主体+景别（如：左边的男人的近景、红衣女子的半身像）

* 摄影专业景别词：远景/全景/中景/近景/特写等
* 美术专业景别词：头像/胸像/半身像/全身像等


<span aceTableMode="list" aceTableWidth="5,4,4"></span>
|**全景镜头** |**中景镜头** |**特写镜头** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0eaf3a234372460c90ff63dda613ec8d~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/fac4cf35d6914b0a895e77c11f104f36~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/de6e4d9978fe4c68b13b46ebee3572cb~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 荒漠黄沙中，一名背着帆布背包、穿长袍与护目镜的旅者独自行走。 镜头以全景视角捕捉广阔地平线，从左向右平稳侧移，旅者在画面中保持小比例。 |> 一位短发少女在街角写生，穿浅色衬衫与背带裙。 镜头保持中景，从 正前方缓慢绕至右前。 |> 镜头聚焦在一位女性的 嘴唇区域，嘴角到鼻下的三角区域完整包含。 她涂着 玫瑰豆沙色唇妆，表面有轻微湿润高光。 她正在说一句话，嘴唇的运动幅度小但节奏自然。 背景是一盏柔光灯形成的模糊光斑，不足以分散注意力。 镜头保持特写构图不变，对准嘴唇进行慢速推近。 |


3. **运镜**
> 运镜描述公式：起幅构图描述+运镜+运镜幅度+落幅构图描述

* 运镜：推/拉/摇/移/跟/升/降/甩/环绕/旋转/变焦
* 运镜方式组合，如：希区柯克镜头=推拉+变焦、子弹时间镜头=升格镜头+快速环绕


<span aceTableMode="list" aceTableWidth="4,4,5"></span>
|**上摇镜头** |**希区柯克变焦** |**推近 dolly\-in** |
|---|---|---|
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/9fc05033512244028541cf3339c5f1f1~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/ea14c1fc3d5c44cbb079f3f2f6c5504a~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/1d93ef5e1f2c4e9cafda0c09e82d7278~tplv-goo7wpa0wc-image.image" controls></video>|\
||||\
|> 精灵族少年站在一颗巨大的发光的树下，指了指上方然后抬起了头看向树冠。镜头上升，大树的主枝杈之间有一个树枝做成的窝，里面有一颗散发着神秘光芒的大恐龙蛋。 |> 近景拍摄一个戴着眼镜五官立体的中国女孩染着红色短发皱着眉头的正面看着镜头。背景是破败的游乐园，远处有停止转动的旋转木马和水上滑梯，地面上满是泥土长满杂草，女孩在执拗地啃着自己的指甲。希区柯克运镜：保持女孩主体构图不变，拉镜头+镜头焦距变长。 |> 场景为湿润的深夜街巷，地面有水渍反光，霓虹牌灯呈蓝红色交替闪动。 一名 约 35 岁、短黑发略凌乱、带轻微胡茬的男子 背靠砖墙站立，正面面对镜头。 他穿着 深黑色皮质风衣（表面有细微磨痕）、深灰高领毛衣，锁骨处布料产生自然阴影。 他的眼神警惕，眉头紧锁，鼻翼轻微张合。 镜头以 中景（胸部以上） 开始，以稳定的滑轨速度 缓慢推近，朝他的脸部靠近，最终到达 极近距离特写（只剩眼睛与鼻梁区域）。 |

<span id="9584df94"></span>
### 特效运用

<span aceTableMode="list" aceTableWidth="1,1,1,1"></span>
|**玩法特效** ||**影视特效** | |
|---|---|---|---|
|**精准描述触发时机** |**精准描述变身过程** |**精准描述变身后的细节** |**音频设计** |
|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/16ee46894e3a4da1a7298b4d073d87eb~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/5257635e040c492c98e1f8ca53fa36fc~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/0b5c65e71ddd4912af2d024ab3356fc5~tplv-goo7wpa0wc-image.image" controls></video>|<video src="https://p9-arcosite.byteimg.com/tos-cn-i-goo7wpa0wc/be1bc9f0208d43a49ba34c19db68d2d3~tplv-goo7wpa0wc-image.image" controls></video>|\
|||||\
|> 她无意间用手指轻轻碰触了那颗旧圣诞球，球体内部瞬间如雪花水晶般亮起柔和的金色光芒。这道光如涟漪般从球体扩散开来，所到之处，空气中凝结出细小的光点。 光芒首先缠绕女孩全身，她的衣服重塑为圣诞装扮，妆容精致；同时，圣诞树从地面生长，彩灯依次点亮，雪花在窗外凭空凝结飘落。整个画面变成圣诞风卧室 |> 猫咪被一团柔软温暖的泡泡光晕包裹，身体逐渐拉长站起。绒毛演化为蓬松的橙色短发，耳朵保留为可爱的猫耳，尾巴轻轻摇摆。服装变为日系休闲卫衣和短裙。最终变身为一个拥有猫瞳和猫耳、表情俏皮可爱的动漫风格少女，对着镜头比出“喵”的手势。请重点刻画猫咪到人物神态的可爱延续，变身过程如棉花糖般柔软平滑。 |> 她的瞳孔颜色由蓝变红。 以她的眼角为起点，原本细腻的皮肤开始硬化、隆起。深黑色的龙鳞仿佛从皮肤底下刺破而出，沿着颧骨向脖颈快速蔓延。伴随着少量的暗红色火星从鳞片缝隙中溢出，她的半张脸在两秒内完成了从人类皮肤到坚硬龙甲的材质置换。 暗黑奇幻（Dark Fantasy），克苏鲁风格，肉体恐怖美学，极度逼真的8k材质细节。 |> 一束温暖的阳光刺破乌云，正好照射在混凝土墙面的中心点。 以光斑为圆心，灰色的混凝土表面瞬间褪色变软。鲜嫩的绿色苔藓和藤蔓以快进摄影的速度疯狂向四周辐射蔓延。紧接着，无数五颜六色的野花在藤蔓上爆裂式绽放）。原本死寂的墙面在几秒内变成了一面随风摆动的垂直花海。 太阳朋克，吉卜力画风，生机勃勃，色彩从单调灰瞬间转为高饱和的绚烂。 |



