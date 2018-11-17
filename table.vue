<!--
父组件调用参考：https://juejin.im/post/5a100d09f265da4324800807， https://segmentfault.com/a/1190000012046845
//sl_table.vue
  <div>
    <sl-table 
    :searchArr="searchArr" @search="search" @reset="reset"
    :tableData="tableData" :tableKey="tableKey"
    :total="total" :pageSize="pageSize" :pageNo="pageNo" @currentChange="currentChange" @sizeChange="sizeChange"
    >
      <template slot="operate" slot-scope="scope">
        <el-tag type="primary" @click.native="test(scope.row)"><i class="fa fa-pencil"></i></el-tag>
      </template>
      <template slot="title" slot-scope="scope">
        <span>slot:&nbsp;{{scope.row.title}}</span>
      </template>
    </sl-table>
  </div>
...
  data(){
    return {
      tableData: [],
      tableKey: [
        { name: '菜品编号', value: 'id' },
        { name: '菜品详情', value: 'title', operate: true },
        { name: '分类', value: 'restaurantMenuCategoryId' },
        { name: '创建时间', value: 'createTime' },
        { name: '操作', value: 'operate', operate: true },
      ],
      searchArr: [
        {label: '菜名', prop: 'title', title: ''},
        {label: '菜品编号', prop: 'code', code: ''},
        // {label:'起止日期', prop:'validDate', isRangeDate: true, validDate: ''},
        {label:'分类', prop:'menuCategoryId', isSelect: true, menuCategoryId: null, selectArr: []},
      ],
      total: 1,
      pageNo: 1,
      pageSize: 10,
      searchCache: {},
    }
  },
  created () {
    this.search({});
    this.cate();
  },
  methods: {
    //搜索按钮
    search ({obj, pageNo}) {
      let form = {};
      if (obj) {
        this.searchCache = obj;
        this.pageNo = 1;// 虽然子组件参数pageNo为1，但分页组件尚未渲染，故要另外赋值。
      } 
      Object.assign(form, this.searchCache, {pageSize: this.pageSize, pageNo: this.pageNo})
      FoodManageService.getFoodsList(form).then(res => {
        this.tableData = res.result.list
        this.total = res.result.total
      }).catch( () => {} )
    },
    //重置按钮
    reset () {
      this.searchCache = {};
      this.pageNo = 1;
      this.search({});
    },
    //分页选择
    currentChange (pageNo) {
      this.pageNo = pageNo;
      this.search({})//有无搜索记录
    },
    //每页显示条数
    sizeChange (pageSize) {
      this.pageSize = pageSize;
      this.search({})//有无搜索记录
    },
    //测试功能
    test (row) {
      console.log(row.id)
    },
    //分类
    cate() {
      FoodManageService.getCates().then(res => {
        this.searchArr[2].selectArr = res.result.map(e => {
          return {
            label: e.name,
            value: e.id
          }
        })
      }).catch(()=>{})
    },
  }
...
-->
<template>
    <div class="table">
        <!-- 搜索 -->
        <el-form :inline="true" class="demo-form-inline" size="mini">

            <el-form-item  v-for="(item, index) in searchArr" :label="item.label" :prop="item.prop" :key="item.label"> 
                <!-- 1.select -->
                <el-select v-model="item[item.prop]" filterable v-if="item.isSelect" :placeholder="item.placeholder" @keyup.enter.native="search">
                    <el-option v-for="option in item.selectArr" :key="option.label" :label="option.label" :value="option.value" ></el-option>
                </el-select>
                <!-- 2.date -->
                <el-date-picker
                    v-model="item[item.prop]"
                    type="daterange"
                    align="right"
                    unlink-panels
                    :clearable="false"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="yyyy-MM-dd"
                    v-else-if="item.isRangeDate"
                    >
                </el-date-picker>
                <!-- 3.input -->
                <el-input v-model.trim="item[item.prop]" :placeholder="`请输入${item.label}`" v-else @keyup.enter.native="search"></el-input>
                <!-- 4.slot -->
                <slot name="customSlot"></slot>
                </el-form-item>


                <el-form-item>
                <el-button type="primary" icon="el-icon-search" @click="search">搜索</el-button>
                <el-button type="default" icon="el-icon-refresh" @click="reset">重置</el-button>
            </el-form-item>
            <el-button v-if="isAdd" type="primary" size="mini" class="global-fr" @click="add">新增<i class="el-icon-plus el-icon--right"></i></el-button>
        </el-form> 


        <!-- 表格 -->
        <el-table :data="tableData">



            <!-- 自定义 -->
            <el-table-column v-for="(item,key) in tableKey" 
                :label="item.name"
                :key="key"
                 v-if="item.operate">
                <template slot-scope="scope">
                    <slot :name="item.value" :$index="scope.$index" :row="scope.row"></slot>
                </template>
            </el-table-column>

            <el-table-column
                v-else
                :key="key"
                :show-overflow-tooltip="item.overflow ? true : false"
                :prop="item.value"
                :label="item.name"
                :width="item.width">
            </el-table-column>

        </el-table>

        <!-- 分页 -->
        <el-pagination
            v-if="total/10 > 1"
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            @size-change="sizeChange"
            @current-change="currentChange"
            :current-page="pageNo">
        </el-pagination>
    </div>
</template>
<script>
export default {
    data(){
        return{
            startDate: '',
            endDate: '',
            formInline: this.searchArr,
        }
    },
    //props:['tableData','tableKey'],
    props: {
        searchArr: Array,
        isAdd: {
            type: Boolean,
            default: false
        },
        tableData: Array,
        tableKey: Array,
        total: Number,
        pageNo: Number,
        pageSize: Number,
    },
    computed: {
        normalizedArr: function () {
            return this.searchArr.map(p => {
                if (!p[p.prop]) return;
                if (p[p.prop] instanceof Array) {
                    this.startDate = p[p.prop][0]
                    this.endDate = p[p.prop][1]
                    return
                }
                // es6
                return {
                    [p.prop]: p[p.prop],
                }

            })
        },
    },
    methods: {
        search () {
            if (this.filterAjax()) return;
            const obj = {}
            this.normalizedArr.map(p => {
                Object.assign(obj, p);
            })
            
            if (this.startDate || this.endDate) {
                Object.assign(obj, {"startDate": this.startDate, "endDate": this.endDate});
            }
            this.$emit('search', {obj: obj});
        },
        // 过滤重复请求,已求反，再确定下！
        filterAjax () {
            let f = {};
            this.formInline.forEach(el => {
                let key = el.prop
                let val = el[key]
                Object.assign(f, {[key]: val})
            });
        
            let bol = true;
            for(let item in f) {
                //console.log(typeof(f[item]))
                let val;
                if (typeof(f[item]) === 'object') {
                    // null
                    val = null;
                } else if (typeof(f[item]) === 'number') {
                    val = null;
                } else if (typeof(f[item]) === 'string') {
                    val = ''
                } else {
                    // typeof(val = undefined) === 'undefined'
                    val = undefined
                }
                if (!(f[item] === val)) {
                    bol = false
                    return
                }
            }
            if (bol || JSON.stringify(this.formInline) === '{}') {
                return true
            } else {
                return false
            }

            
        },
        reset () {
            // 过滤重复请求
            if (this.filterAjax()) return;
            this.startDate = '';
            this.endDate = '';
            this.searchArr.map(p => {
                p[p.prop] = ''
            })
            this.$emit('reset');
        },
        add () {
            this.$emit('add')
        },
        currentChange (pageNo) {
            this.$emit('currentChange', pageNo)
        },
        sizeChange (pageSize) {
            this.$emit('sizeChange', pageSize)
        }
  }
}
</script>
<style>

</style>
