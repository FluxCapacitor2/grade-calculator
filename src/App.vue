<template>
  <div class="tabs">
    <div v-for="course, idx in courses" class="tab">
      <button @click="load(idx)">{{ course.name }}</button>
      <button @click="courses.splice(idx, 1); selected = courses.length - 1;">-</button>
    </div>
    <button @click="addNewCourse()" v-if="courses.length > 0">+</button>
  </div>
  <main v-if="courses[selected]">
    <h1>Grade Calculator: <input v-model="courses[selected].name"></h1>
    <div>
      <h2>Buckets</h2>
      <div class="subsection">
        <input type="text" v-model="name" placeholder="Name">
        <input type="text" v-model="json" placeholder="JSON">
        <input type="number" v-model="weight" placeholder="Weight">
        <button @click="parse()">Import Bucket</button>
      </div>
      <div v-for="bucket, idx in courses[selected].buckets" class="subsection">
        <input v-model="bucket.name">
        <p>Assignments: {{ bucket.assignments.length }}, Weight: <input v-model="bucket.weight">%</p>
        <button @click="courses[selected].buckets.splice(idx, 1)">Remove</button>
      </div>
      <div class="subsection">
        <button @click="courses[selected].buckets.push({ name: 'New Bucket', assignments: [], weight: 0.1 })">New
          Bucket</button>
      </div>
    </div>
    <div v-if="courses[selected].buckets.length !== 0">
      <div class="main-grid">
        <div>
          <h2>Assignments</h2>
          <div v-for="bucket in courses[selected].buckets" class="subsection">
            <h3>{{ bucket.name }}</h3>
            <table>
              <thead>
                <tr>
                  <td>#</td>
                  <td>Name</td>
                  <td>Category</td>
                  <td>Weighted Grade</td>
                  <td>Exclude</td>
                  <td>Actions</td>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item, idx in bucket.assignments">
                  <td>{{ idx + 1 }}</td>
                  <td><input v-model="item.name"></td>
                  <td><input v-model="item.category"></td>
                  <td><input v-model="item.weighted"></td>
                  <td><input type="checkbox" v-model="item.flags" value="exempt"></td>
                  <button @click="bucket.assignments.splice(idx, 1)">Remove</button>
                </tr>
                <tr>
                  <td></td>
                  <td>
                    <button
                      @click="bucket.assignments.push({ name: 'Name', category: 'Category', flags: [], weighted: '10/10' })">
                      Add Assignment
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2>Final Grade</h2>
          <div class="subsection">
            <p>Estimated final grade: <b>{{ r(finalGrade) }}%</b></p>
            <p>Minimum grade needed on the final exam for an A: <b>{{ r(minExamGrade(90)) }}%</b></p>
            <p>Minimum grade needed on the final exam for an B: <b>{{ r(minExamGrade(80)) }}%</b></p>
            <p>Minimum grade needed on the final exam for an C: <b>{{ r(minExamGrade(70)) }}%</b></p>
            <p>Minimum grade needed on the final exam to pass the class: <b>{{ r(minExamGrade(60)) }}%</b></p>
            You're guaranteed to get at least a <b>{{ r(this.getGradeWithoutFinal()) }}%</b> in the class.
          </div>
        </div>
        <div>
          <h2>Subsection Grades</h2>
          <div v-for="bucket in courses[selected].buckets" class="subsection">
            <h3>{{ bucket.name }}</h3>
            <p v-for="item in getGrades(bucket)">
              <em v-if="!isNaN(item.grade.percent)">{{ item.category.name }}:
                Earned {{ r(item.grade.earned) }}
                out of {{ r(item.grade.total) }}
                total points ({{ r(item.grade.percent * 100) }}%)
              </em>
            </p>
            <p>Bucket grade estimate: <b>{{ r(getFinalGrade(bucket)) }}%</b></p>
          </div>
        </div>
        <div>
          <h2>Categories</h2>
          <div v-if="unknownCategories.length !== 0">
            <p>⚠️ There are {{ unknownCategories.length }} unknown categories which are not counted!</p>
            <button @click="fixCategories()">Fix</button>
          </div>
          <div v-for="cat, idx in courses[selected].categories" class="subsection">
            <input v-model="cat.name">
            <p><em>Includes: </em>
              <input v-for="inc, idx in cat.include" v-model="cat.include[idx]">
              <button @click="cat.include.push('')">+</button>
              <button @click="cat.include.splice(cat.include.length - 1, 1)">-</button>
            </p>
            <p><em>Weight:</em> <input v-model="cat.weight"></p>
            <button @click="courses[selected].categories.splice(idx, 1)">Remove</button>
          </div>
          <button @click="courses[selected].categories.push({name: 'New Category', weight: 0.1, include: []})">Add Category</button>
        </div>
      </div>
    </div>
  </main>
  <main v-else>
    <h1>Grade Calculator: Get Started</h1>
    <p>Add a new course:</p>
    <button @click="addNewCourse()">Add Course</button>
  </main>
</template>

<script>

export default {
  data() {
    return {
      name: undefined,
      json: undefined,
      weight: undefined,

      selected: 0,

      courses: [],
    }
  },
  computed: {
    finalGrade() {
      return this.courses[this.selected].buckets.reduce((acc, bucket) => {
        return acc + this.getFinalGrade(bucket) * bucket.weight;
      }, 0.0);
    },
    unknownCategories() {
      const assignments = this.courses[this.selected].buckets.flatMap((bucket) => bucket.assignments);
      const categories = this.courses[this.selected].categories;
      return [...new Set(assignments.reduce((acc, assignment) => {
        if (categories.filter((cat) => cat.include.includes(assignment.category)).length !== 0) {
          return acc;
        } else {
          return [...acc, assignment.category];
        }
      }, []))];
    }
  },
  methods: {
    r(number) {
      return Math.round(number * 100) / 100;
    },
    fixCategories() {
      this.unknownCategories.forEach((name) => {
        this.courses[this.selected].categories.push({
          name: "New Category",
          weight: 0.1,
          include: [name],
        })
      });
    },
    load(idx) {
      this.selected = idx;
    },
    addNewCourse() {
      this.courses.push({
        name: "New Course",
        buckets: [],
        categories: [],
      });
      this.load(this.courses.length - 1);
    },
    getGradeWithoutFinal() {
      return this.courses[this.selected].buckets
        .filter((b) => b.name != "Final Exam")
        .reduce((acc, bucket) => {
          return acc + this.getFinalGrade(bucket) * bucket.weight;
        }, 0.0);
    },
    minExamGrade(finalGrade) {
      const gradeWithoutFinal = this.getGradeWithoutFinal();
      const finalWeight = this.courses[this.selected].buckets.filter((b) => b.name == "Final Exam")[0]?.weight ?? 0.2;

      return (1 / finalWeight) * (finalGrade - gradeWithoutFinal);
    },
    getGrades(bucket) {
      return this.courses[this.selected].categories.map((c) => {
        const grade = this.getGrade(bucket, c);
        return {
          bucket: bucket,
          category: c,
          grade: grade,
        }
      });
    },
    getFinalGrade(bucket) {
      return this.getGrades(bucket).reduce((acc, item) => {
        if (isNaN(item.grade.percent)) return acc;
        return acc + item.grade.percent * item.category.weight;
      }, 0.0) * 100;
    },
    parse() {
      this.courses[this.selected].buckets.push({
        name: this.name,
        assignments: JSON.parse(this.json),
        weight: this.weight
      });
      this.name = undefined;
      this.json = undefined;
      this.weight = undefined;
    },
    getGrade(bucket, cat) {
      const points = bucket.assignments
        .filter((a) => cat.include.includes(a.category))
        .filter((a) => !a.flags.includes("exempt") && !a.flags.includes("excluded"))
        .map((a) => a.weighted.split("/"))
        .reduce((acc, a) => {
          if (a.length == 2) {
            if (a[0] != "--") {
              return {
                earned: acc.earned + +a[0],
                total: acc.total + +a[1]
              };
            }
          }
          return acc;
        }, { earned: 0, total: 0 });

      points.percent = points.earned / points.total;

      return points;
    }
  },
  watch: {
    courses: {
      deep: true,
      handler(newValue) {
        localStorage.setItem("grade_calculator_courses_json", JSON.stringify(newValue));
      }
    }
  },
  mounted() {
    const json = localStorage.getItem("grade_calculator_courses_json");
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (ignored) { }

    if (parsed === undefined || json === null) {
      // The JSON is missing or invalid
      this.courses = [];
    } else {
      // The JSON is valid
      this.courses = JSON.parse(json);
    }
  }
}
</script>

<style scoped>
.subsection {
  background: var(--item-background);
  margin: 10px 0;
  border-radius: 10px;
  padding: 10px;
}

.inputs {
  display: grid;
  grid-template-columns: auto auto;
  column-gap: 1em;
  align-content: center;
}

.inputs .subsection {
  display: flex;
  align-items: center;
  justify-content: center;
}

.inputs input {
  margin: 0 0.5em;
}

b {
  font-weight: bold;
  color: black;
}

@media (prefers-color-scheme: dark) {
  b {
    color: white;
  }
}

.main-grid {
  display: grid;
  grid-template-columns: repeat(2, auto);
  column-gap: 2em;
}

.main-grid *:first-child {
  grid-row: span 3;
}

.tabs .tab {
  display: inline;
  margin: 0 1em;
}
</style>
