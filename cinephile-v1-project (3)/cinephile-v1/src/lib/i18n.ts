import React, { createContext, useContext, useState, useEffect } from 'react';
import { WatchStatus, WorkType } from '../types';

export type Language = 'zh' | 'en';

export interface TranslationDictionary {
  // Brand & Nav
  brand: string;
  nav: {
    home: string;
    library: string;
    discover: string;
    people: string;
    journal: string;
  };
  actions: {
    searchPlaceholder: string;
    clear: string;
    syncTmdb: string;
    syncing: string;
    folioData: string;
    inscribe: string;
    inscribeFirst: string;
    restoreClassics: string;
    openFolio: string;
    favor: string;
    favored: string;
    rate: string;
    edit: string;
    remove: string;
    delete: string;
    back: string;
    close: string;
    save: string;
    cancel: string;
    confirm: string;
    prev: string;
    next: string;
    indexAll: string;
    details: string;
    dismiss: string;
    restoreHidden: string;
    unlink: string;
    rename: string;
    addLog: string;
    addStill: string;
    addScore: string;
    uploadImage: string;
    imageSelected: string;
    appleMusicSearch: string;
  };
  status: Record<WatchStatus, string>;
  type: Record<WorkType, string>;
  views: {
    folio: string;
    dense: string;
    index: string;
  };
  sort: {
    label: string;
    createdAtDesc: string;
    createdAtAsc: string;
    ratingDesc: string;
    yearDesc: string;
    titleAsc: string;
    peopleCountDesc: string;
    peopleCountAsc: string;
  };
  home: {
    emptyTitle: string;
    currentlyScreening: string;
    recentAcquisitions: string;
    personalCanon: string;
    curatedResonance: string;
    emptySection: string;
    min: string;
  };
  library: {
    allWorks: string;
    curatedFolios: string;
    indexTags: string;
    showingCount: (showing: number, total: number) => string;
    statusFilterLabel: string;
    favoredOnly: string;
    mediumFilterLabel: string;
    scoreFilterLabel: string;
    eraFilterLabel: string;
    genreFilterLabel: string;
    tagFilterLabel: string;
    all: string;
    reset: string;
    noResults: string;
    deleteConfirm: (title: string) => string;
    newFolio: string;
    editFolio: (name: string) => string;
    folioTitlePlaceholder: string;
    curatorNotePlaceholder: string;
    addToFolio: string;
    newTag: string;
    editTag: (name: string) => string;
    tagNamePlaceholder: string;
  };
  workDetail: {
    notFound: string;
    synopsisAndNote: string;
    stills: string;
    screeningJournal: string;
    originalScore: string;
    lineage: string;
    credits: string;
    memberOfFolios: string;
    emptyJournal: string;
    emptyStills: string;
    rewatch: string;
    deleteWorkConfirm: (title: string) => string;
    stillTitlePlaceholder: string;
    visualNotePlaceholder: string;
    trackTitlePlaceholder: string;
    composerPlaceholder: string;
    albumPlaceholder: string;
    appleMusicPlaceholder: string;
    listeningNotePlaceholder: string;
  };
  discover: {
    curatorialAdvisor: string;
    advisorLocalNotice: string;
    advisorPrompts: {
      highRated: string;
      auteurFocus: string;
      crossGenre: string;
      lateNight: string;
    };
    priorityUnwatched: string;
    auteurCastLineage: string;
    thematicResonance: string;
    crossMediumHorizon: string;
  };
  people: {
    title: string;
    roleFilterLabel: string;
    roles: {
      all: string;
      director: string;
      actor: string;
      composer: string;
    };
    worksCount: (count: number) => string;
    archivedFilmography: string;
    archivedCount: string;
    meanScore: string;
    emptyWorks: string;
    returnToDirectory: string;
  };
  journal: {
    totalScreenings: string;
    worksCount: string;
    yearCount: string;
    meanScore: string;
    yearFilterLabel: string;
    scoreFilterLabel: string;
    all: string;
    emptyTitle: string;
    rewatch: string;
  };
  modals: {
    quickRateTitle: string;
    personalScore: string;
    unrated: string;
    enableScore: string;
    leaveBlank: string;
    curatorNoteLabel: string;
    curatorNotePlaceholder: string;
    workFolioRevision: string;
    workFolioAcquisition: string;
    tmdbLookupLabel: string;
    tmdbLookupPlaceholder: string;
    queryTmdb: string;
    fillFolio: string;
    existingCheckLabel: string;
    existingCheckPlaceholder: string;
    reuseAction: (title: string, year: number) => string;
    titleLabel: string;
    titlePlaceholder: string;
    originalLabel: string;
    originalPlaceholder: string;
    yearLabel: string;
    runtimeLabel: string;
    scoreLabel: string;
    directorLabel: string;
    castLabel: string;
    genreLabel: string;
    tagsLabel: string;
    synopsisLabel: string;
    noteLabel: string;
    commitRevision: string;
    inscribeAction: string;
    logTitleNew: string;
    logTitleEdit: string;
    workLabel: string;
    dateLabel: string;
    editionLabel: string;
    firstViewing: string;
    essayLabel: string;
    essayPlaceholder: string;
    dataManagementTitle: string;
    csvTab: string;
    jsonTab: string;
    resetTab: string;
    skipDuplicates: string;
    mergeDuplicates: string;
    parsePreview: string;
    exportJsonAction: string;
    restoreJsonAction: string;
    chooseJsonFile: string;
    validateJsonFormat: string;
    restoreConfirm: string;
    syncTmdbNotice: (count: number) => string;
    refreshAllPosters: string;
    resetDemoAction: string;
    clearAllAction: string;
    resetConfirmPrompt: string;
    clearConfirmPrompt: string;
  };
  toasts: {
    favored: (title: string) => string;
    unfavored: (title: string) => string;
    scoreUpdated: string;
    statusUpdated: (status: string) => string;
    workUpdated: (title: string) => string;
    workInscribed: (title: string) => string;
    workDeleted: (title: string) => string;
    logSaved: string;
    logDeleted: string;
    collectionCreated: (name: string) => string;
    collectionUpdated: (name: string) => string;
    collectionDeleted: string;
    collectionMembershipUpdated: string;
    tagCreated: (name: string) => string;
    tagUpdated: (name: string) => string;
    tagDeleted: string;
    stillSaved: (title: string) => string;
    soundtrackSaved: (title: string) => string;
    syncSuccess: (worksCount: number, peopleCount: number) => string;
    syncFailed: (msg: string) => string;
    importSuccess: (created: number, updated: number) => string;
    restoreSuccess: (count: number) => string;
    resetSuccess: string;
    clearSuccess: string;
    dismissed: string;
    restoredRecs: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  zh: {
    brand: 'CINEPHILE',
    nav: {
      home: '首页',
      library: '片库',
      discover: '发现',
      people: '影人',
      journal: '日志',
    },
    actions: {
      searchPlaceholder: '检索档案…',
      clear: '清空',
      syncTmdb: '同步 TMDB',
      syncing: '同步中…',
      folioData: '卷宗备份',
      inscribe: '收录',
      inscribeFirst: '收录第一部作品',
      restoreClassics: '载入 26 部馆藏演示作品',
      openFolio: '查看档案',
      favor: '典藏',
      favored: '已典藏',
      rate: '评分',
      edit: '编辑',
      remove: '移除',
      delete: '删除',
      back: '返回',
      close: '收起',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      prev: '上一部',
      next: '下一部',
      indexAll: '浏览全部',
      details: '详情',
      dismiss: '忽略',
      restoreHidden: '恢复已隐藏候选',
      unlink: '移出',
      rename: '重命名',
      addLog: '撰写随笔',
      addStill: '归档剧照',
      addScore: '关联曲目',
      uploadImage: '上传图片',
      imageSelected: '已选本地图片',
      appleMusicSearch: 'Apple Music 原声检索',
    },
    status: {
      Watched: '已看',
      Watching: '在看',
      'Want to Watch': '想看',
      Paused: '搁置',
      Dropped: '弃剧',
    },
    type: {
      Movie: '电影',
      'TV Series': '剧集',
      Anime: '动画',
      Documentary: '纪录片',
    },
    views: {
      folio: '画册',
      dense: '紧凑',
      index: '索引',
    },
    sort: {
      label: '排序',
      createdAtDesc: '最新归档',
      createdAtAsc: '最早归档',
      ratingDesc: '最高评分',
      yearDesc: '上映年份',
      titleAsc: '片名索引',
      peopleCountDesc: '作品数：多到少',
      peopleCountAsc: '作品数：少到多',
    },
    home: {
      emptyTitle: '私人胶片档案尚无藏品',
      currentlyScreening: '在看与待看',
      recentAcquisitions: '近期归档',
      personalCanon: '私人典藏',
      curatedResonance: '审美脉络推荐',
      emptySection: '暂无归档条目',
      min: '分钟',
    },
    library: {
      allWorks: '全部作品',
      curatedFolios: '主题片单',
      indexTags: '个人标签',
      showingCount: (showing, total) => `显示 ${showing} / 共 ${total}`,
      statusFilterLabel: '状态',
      favoredOnly: '仅典藏',
      mediumFilterLabel: '媒介',
      scoreFilterLabel: '评分',
      eraFilterLabel: '年代',
      genreFilterLabel: '流派',
      tagFilterLabel: '标签',
      all: '全部',
      reset: '重置',
      noResults: '未找到符合当前索引条件的作品',
      deleteConfirm: (title) => `确认从档案馆永久移除《${title}》？`,
      newFolio: '新建主题片单',
      editFolio: (name) => `修订片单 · ${name}`,
      folioTitlePlaceholder: '片单名称…',
      curatorNotePlaceholder: '策展导语…',
      addToFolio: '加入作品…',
      newTag: '新建标签',
      editTag: (name) => `修订标签 · #${name}`,
      tagNamePlaceholder: '标签名称…',
    },
    workDetail: {
      notFound: '该作品档案不存在或已被移除',
      synopsisAndNote: '剧情与馆藏手记',
      stills: '典藏剧照',
      screeningJournal: '观影随笔',
      originalScore: '原声音乐',
      lineage: '脉络关联',
      credits: '演职人员',
      memberOfFolios: '归属片单',
      emptyJournal: '暂无观影随笔',
      emptyStills: '暂无剧照',
      rewatch: '重温',
      deleteWorkConfirm: (title) => `确认从档案馆移除《${title}》及其关联随笔？`,
      stillTitlePlaceholder: '剧照标题…',
      visualNotePlaceholder: '镜头或构图备注…',
      trackTitlePlaceholder: '曲目名称 *',
      composerPlaceholder: '作曲家 / 艺术家',
      albumPlaceholder: '原声专辑',
      appleMusicPlaceholder: 'Apple Music 链接 (可选)',
      listeningNotePlaceholder: '配乐备注…',
    },
    discover: {
      curatorialAdvisor: '私人策展顾问',
      advisorLocalNotice: '本地规则引擎',
      advisorPrompts: {
        highRated: '高分优先待看',
        auteurFocus: '偏爱导演脉络',
        crossGenre: '跨媒介探索',
        lateNight: '深夜与配乐',
      },
      priorityUnwatched: '优先待看与高分关联',
      auteurCastLineage: '同导演与演员脉络',
      thematicResonance: '同标签与流派共鸣',
      crossMediumHorizon: '跨媒介探索',
    },
    people: {
      title: '影人档案',
      roleFilterLabel: '身份',
      roles: {
        all: '全部',
        director: '导演',
        actor: '演员',
        composer: '配乐',
      },
      worksCount: (count) => `${count} 部作品`,
      archivedFilmography: '关联馆藏',
      archivedCount: '关联藏品',
      meanScore: '平均评分',
      emptyWorks: '暂无关联作品',
      returnToDirectory: '返回人物名录',
    },
    journal: {
      totalScreenings: '累计观影',
      worksCount: '记录作品',
      yearCount: '2026 年度',
      meanScore: '平均评分',
      yearFilterLabel: '年份',
      scoreFilterLabel: '评分',
      all: '全部',
      emptyTitle: '暂无观影随笔',
      rewatch: '重温',
    },
    modals: {
      quickRateTitle: '批注与状态',
      personalScore: '个人评分',
      unrated: '未评分',
      enableScore: '启用评分',
      leaveBlank: '设为未评分',
      curatorNoteLabel: '私人馆藏手记',
      curatorNotePlaceholder: '撰写私人手记…',
      workFolioRevision: '修订卷宗',
      workFolioAcquisition: '收录影视档案',
      tmdbLookupLabel: 'TMDB 智能检索',
      tmdbLookupPlaceholder: '输入片名检索 TMDB 元数据…',
      queryTmdb: '检索 TMDB',
      fillFolio: '填入卷宗',
      existingCheckLabel: '馆藏查重',
      existingCheckPlaceholder: '检查馆藏已有记录避免重复…',
      reuseAction: (title, year) => `复用《${title}》(${year})`,
      titleLabel: '片名',
      titlePlaceholder: '例如：悲情城市',
      originalLabel: '原名',
      originalPlaceholder: 'A City of Sadness',
      yearLabel: '年份',
      runtimeLabel: '片长',
      scoreLabel: '评分',
      directorLabel: '导演',
      castLabel: '演员',
      genreLabel: '流派',
      tagsLabel: '标签索引',
      synopsisLabel: '梗概',
      noteLabel: '按语',
      commitRevision: '保存档案更新',
      inscribeAction: '收录至档案馆',
      logTitleNew: '撰写观影随笔',
      logTitleEdit: '修订观影随笔',
      workLabel: '作品',
      dateLabel: '日期',
      editionLabel: '版本',
      firstViewing: '首次观看',
      essayLabel: '随笔内容',
      essayPlaceholder: '记录关于光影、声效与记忆的感受…',
      dataManagementTitle: '数据卷宗管理',
      csvTab: 'CSV 批量导入与预览',
      jsonTab: 'JSON 完整备份与恢复',
      resetTab: '海报同步与重置',
      skipDuplicates: '自动跳过同名作品',
      mergeDuplicates: '合并更新同名作品',
      parsePreview: '解析并生成导入预览',
      exportJsonAction: '导出 JSON 备份文件',
      restoreJsonAction: '确认执行数据恢复',
      chooseJsonFile: '选择本地 .json 文件',
      validateJsonFormat: '校验备份文件格式',
      restoreConfirm: '确认执行数据恢复',
      syncTmdbNotice: (count) => `同步全部 ${count} 部馆藏的 TMDB 原版海报与影人肖像`,
      refreshAllPosters: '立即刷新全部海报',
      resetDemoAction: '恢复默认演示数据',
      clearAllAction: '清空全部数据',
      resetConfirmPrompt: '确定重置为初始演示数据吗？',
      clearConfirmPrompt: '确定清空全部馆藏与随笔吗？',
    },
    toasts: {
      favored: (title) => `已将《${title}》收入典藏`,
      unfavored: (title) => `已将《${title}》移出典藏`,
      scoreUpdated: '已保存评分与状态',
      statusUpdated: (status) => `状态已更新为：${status}`,
      workUpdated: (title) => `已更新《${title}》`,
      workInscribed: (title) => `已收录《${title}》`,
      workDeleted: (title) => `已移除《${title}》`,
      logSaved: '已保存观影随笔',
      logDeleted: '已删除观影随笔',
      collectionCreated: (name) => `已创建片单「${name}」`,
      collectionUpdated: (name) => `已更新片单「${name}」`,
      collectionDeleted: '已移除片单',
      collectionMembershipUpdated: '已更新片单归属',
      tagCreated: (name) => `已创建标签 #${name}`,
      tagUpdated: (name) => `已更新标签 #${name}`,
      tagDeleted: '已删除标签',
      stillSaved: (title) => `已归档剧照「${title}」`,
      soundtrackSaved: (title) => `已关联原声「${title}」`,
      syncSuccess: (worksCount, peopleCount) => `已同步 ${worksCount} 部作品海报与 ${peopleCount} 位影人肖像`,
      syncFailed: (msg) => `同步异常：${msg}`,
      importSuccess: (created, updated) => `导入完成：新增 ${created} 部，更新 ${updated} 部`,
      restoreSuccess: (count) => `已恢复备份数据（${count} 部作品）`,
      resetSuccess: '已恢复 26 部馆藏演示数据',
      clearSuccess: '已清空演示数据',
      dismissed: '已忽略该推荐',
      restoredRecs: '已恢复推荐候选',
    },
  },
  en: {
    brand: 'CINEPHILE',
    nav: {
      home: 'Home',
      library: 'Library',
      discover: 'Discover',
      people: 'People',
      journal: 'Journal',
    },
    actions: {
      searchPlaceholder: 'Search archive…',
      clear: 'clear',
      syncTmdb: 'sync TMDB',
      syncing: 'syncing…',
      folioData: 'folio data',
      inscribe: 'inscribe',
      inscribeFirst: 'inscribe first work',
      restoreClassics: 'restore 26 archival classics',
      openFolio: 'open folio',
      favor: 'favor',
      favored: 'favored',
      rate: 'rate',
      edit: 'edit',
      remove: 'remove',
      delete: 'delete',
      back: 'back',
      close: 'close',
      save: 'save',
      cancel: 'cancel',
      confirm: 'confirm',
      prev: 'prev',
      next: 'next',
      indexAll: 'browse all',
      details: 'details',
      dismiss: 'dismiss',
      restoreHidden: 'restore hidden items',
      unlink: 'unlink',
      rename: 'rename',
      addLog: 'log entry',
      addStill: 'archive still',
      addScore: 'link score',
      uploadImage: 'upload image',
      imageSelected: 'image selected',
      appleMusicSearch: 'Apple Music soundtrack search',
    },
    status: {
      Watched: 'watched',
      Watching: 'watching',
      'Want to Watch': 'to watch',
      Paused: 'paused',
      Dropped: 'dropped',
    },
    type: {
      Movie: 'film',
      'TV Series': 'series',
      Anime: 'animation',
      Documentary: 'documentary',
    },
    views: {
      folio: 'folio',
      dense: 'dense',
      index: 'index',
    },
    sort: {
      label: 'sort',
      createdAtDesc: 'newest added',
      createdAtAsc: 'oldest added',
      ratingDesc: 'highest rated',
      yearDesc: 'release year',
      titleAsc: 'title A–Z',
      peopleCountDesc: 'works: high to low',
      peopleCountAsc: 'works: low to high',
    },
    home: {
      emptyTitle: 'No items in the private film archive',
      currentlyScreening: 'currently screening',
      recentAcquisitions: 'recent acquisitions',
      personalCanon: 'personal canon',
      curatedResonance: 'curated resonance',
      emptySection: 'No archival items',
      min: 'min',
    },
    library: {
      allWorks: 'all works',
      curatedFolios: 'curated folios',
      indexTags: 'index tags',
      showingCount: (showing, total) => `showing ${showing} of ${total}`,
      statusFilterLabel: 'status',
      favoredOnly: 'favored only',
      mediumFilterLabel: 'medium',
      scoreFilterLabel: 'score',
      eraFilterLabel: 'era',
      genreFilterLabel: 'genre',
      tagFilterLabel: 'tag',
      all: 'all',
      reset: 'reset',
      noResults: 'No works match the selected criteria',
      deleteConfirm: (title) => `Permanently remove "${title}" from archive?`,
      newFolio: 'new folio',
      editFolio: (name) => `revise folio · ${name}`,
      folioTitlePlaceholder: 'Folio title…',
      curatorNotePlaceholder: 'Curator note…',
      addToFolio: 'add work…',
      newTag: 'new tag',
      editTag: (name) => `revise tag · #${name}`,
      tagNamePlaceholder: 'Tag name…',
    },
    workDetail: {
      notFound: 'This archival record does not exist or has been removed',
      synopsisAndNote: 'synopsis & note',
      stills: 'stills',
      screeningJournal: 'screening journal',
      originalScore: 'original score',
      lineage: 'lineage',
      credits: 'credits',
      memberOfFolios: 'folios',
      emptyJournal: 'No screening reflections yet',
      emptyStills: 'No stills archived',
      rewatch: 'rewatch',
      deleteWorkConfirm: (title) => `Remove "${title}" and all associated reflections?`,
      stillTitlePlaceholder: 'Still title…',
      visualNotePlaceholder: 'Visual note…',
      trackTitlePlaceholder: 'Track title *',
      composerPlaceholder: 'Composer / Artist',
      albumPlaceholder: 'Album',
      appleMusicPlaceholder: 'Apple Music URL (optional)',
      listeningNotePlaceholder: 'Listening note…',
    },
    discover: {
      curatorialAdvisor: 'curatorial advisor',
      advisorLocalNotice: 'local rule engine',
      advisorPrompts: {
        highRated: 'high-rated priority',
        auteurFocus: 'preferred auteur lineage',
        crossGenre: 'cross-medium horizon',
        lateNight: 'late night & score',
      },
      priorityUnwatched: 'priority unwatched',
      auteurCastLineage: 'auteur & cast lineage',
      thematicResonance: 'thematic resonance',
      crossMediumHorizon: 'cross-medium horizon',
    },
    people: {
      title: 'creator folios',
      roleFilterLabel: 'role',
      roles: {
        all: 'all',
        director: 'director',
        actor: 'actor',
        composer: 'composer',
      },
      worksCount: (count) => `${count} works`,
      archivedFilmography: 'archived filmography',
      archivedCount: 'archived works',
      meanScore: 'mean score',
      emptyWorks: 'No associated works archived',
      returnToDirectory: 'return to directory',
    },
    journal: {
      totalScreenings: 'screenings',
      worksCount: 'works',
      yearCount: '2026 year',
      meanScore: 'mean score',
      yearFilterLabel: 'year',
      scoreFilterLabel: 'score',
      all: 'all',
      emptyTitle: 'No screening journal reflections',
      rewatch: 'rewatch',
    },
    modals: {
      quickRateTitle: 'inline annotation',
      personalScore: 'personal score (10-point)',
      unrated: 'unrated',
      enableScore: 'enable score',
      leaveBlank: 'leave blank',
      curatorNoteLabel: 'curator note',
      curatorNotePlaceholder: 'Write a quiet archival note…',
      workFolioRevision: 'archive folio revision',
      workFolioAcquisition: 'archive acquisition folio',
      tmdbLookupLabel: 'TMDB lookup',
      tmdbLookupPlaceholder: 'Type film title for TMDB metadata…',
      queryTmdb: 'query TMDB',
      fillFolio: 'fill folio',
      existingCheckLabel: 'existing archive check',
      existingCheckPlaceholder: 'Check existing archive to avoid duplicates…',
      reuseAction: (title, year) => `reuse "${title}" (${year})`,
      titleLabel: 'title',
      titlePlaceholder: 'e.g. A City of Sadness',
      originalLabel: 'original',
      originalPlaceholder: 'A City of Sadness',
      yearLabel: 'year',
      runtimeLabel: 'min',
      scoreLabel: 'score',
      directorLabel: 'director',
      castLabel: 'cast',
      genreLabel: 'genre',
      tagsLabel: 'tags',
      synopsisLabel: 'synopsis',
      noteLabel: 'note',
      commitRevision: 'commit revision',
      inscribeAction: 'inscribe into archive',
      logTitleNew: 'screening journal entry',
      logTitleEdit: 'revise screening reflections',
      workLabel: 'work',
      dateLabel: 'date',
      editionLabel: 'edition',
      firstViewing: 'first viewing',
      essayLabel: 'essay & reflections',
      essayPlaceholder: 'Inscribe your reflections on light, sound, and memory…',
      dataManagementTitle: 'archival preservation & portability',
      csvTab: 'csv batch import',
      jsonTab: 'json backup & restore',
      resetTab: 'tmdb sync & reset',
      skipDuplicates: 'skip duplicates',
      mergeDuplicates: 'merge duplicates',
      parsePreview: 'parse preview',
      exportJsonAction: 'export JSON backup',
      restoreJsonAction: 'confirm restore',
      chooseJsonFile: 'choose local .json file',
      validateJsonFormat: 'validate format',
      restoreConfirm: 'confirm restore',
      syncTmdbNotice: (count) => `Sync TMDB official artwork & portraits for all ${count} works`,
      refreshAllPosters: 'refresh all posters',
      resetDemoAction: 'restore default demo data',
      clearAllAction: 'clear all data',
      resetConfirmPrompt: 'Reset to default demo data?',
      clearConfirmPrompt: 'Clear all archive records?',
    },
    toasts: {
      favored: (title) => `Inscribed "${title}" to favorites`,
      unfavored: (title) => `Removed "${title}" from favorites`,
      scoreUpdated: 'Saved rating & status',
      statusUpdated: (status) => `Status updated: ${status}`,
      workUpdated: (title) => `Updated "${title}"`,
      workInscribed: (title) => `Inscribed "${title}"`,
      workDeleted: (title) => `Removed "${title}"`,
      logSaved: 'Saved screening journal',
      logDeleted: 'Removed journal entry',
      collectionCreated: (name) => `Created folio "${name}"`,
      collectionUpdated: (name) => `Updated folio "${name}"`,
      collectionDeleted: 'Removed folio',
      collectionMembershipUpdated: 'Updated folio membership',
      tagCreated: (name) => `Created tag #${name}`,
      tagUpdated: (name) => `Updated tag #${name}`,
      tagDeleted: 'Removed tag',
      stillSaved: (title) => `Archived still "${title}"`,
      soundtrackSaved: (title) => `Linked score "${title}"`,
      syncSuccess: (worksCount, peopleCount) => `Synced ${worksCount} posters and ${peopleCount} portraits from TMDB`,
      syncFailed: (msg) => `Sync error: ${msg}`,
      importSuccess: (created, updated) => `Import finished: +${created} new, ${updated} updated`,
      restoreSuccess: (count) => `Restored backup (${count} works)`,
      resetSuccess: 'Restored 26 archival classics',
      clearSuccess: 'Cleared all archive data',
      dismissed: 'Dismissed recommendation',
      restoredRecs: 'Restored recommendations',
    },
  },
};

export const LanguageContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationDictionary;
}>({
  lang: 'zh',
  setLang: () => {},
  t: translations.zh,
});

export const useLanguage = () => useContext(LanguageContext);
